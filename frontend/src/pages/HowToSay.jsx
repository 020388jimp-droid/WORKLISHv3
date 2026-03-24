import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Lightbulb, 
  Languages,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { howToSay, generateSpeech } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

export const HowToSay = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userProfile } = useAuth();
  const { t, feedbackLang } = useLanguage();
  
  const [text, setText] = useState('');
  const [context, setContext] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Audio State
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    return localStorage.getItem('isAudioEnabled') === 'true';
  });
  const [lastAudio, setLastAudio] = useState(null);

  const contexts = [
    { value: 'general', label: 'Conversación General' },
    { value: 'professional', label: 'Entorno Profesional' },
    { value: 'social', label: 'Eventos Sociales' },
    { value: 'travel', label: 'Viajes' },
    { value: 'emergency', label: 'Emergencias/Urgencias' }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    localStorage.setItem('isAudioEnabled', newState.toString());
    toast.success(newState ? 'Voz activada' : 'Voz desactivada');
  };

  const playTutorAudio = async (textToPlay) => {
    try {
      // Si ya tenemos el audio guardado para este mismo texto, no gastamos API
      if (lastAudio && lastAudio.text === textToPlay) {
        const audio = new Audio(`data:audio/mp3;base64,${lastAudio.content}`);
        audio.play();
        return;
      }

      const { audioContent } = await generateSpeech(textToPlay, userProfile?.preferred_voice || 'orion');
      
      // Guardar el audio para permitir repetir sin costo de API
      setLastAudio({ text: textToPlay, content: audioContent });
      
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      audio.play();

    } catch (err) {
      console.error('Audio Error:', err);
      // Respaldo navegador (SpeechSynthesis)
      const cleanText = textToPlay.replace(/\*+/g, '').replace(/\(([^)]+)\)/g, '$1');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useCallback((node) => {
    if (node !== null) {
      // Logic for media recorder if needed elsewhere
    }
  }, []);
  const recorderInstance = React.useRef(null);
  const audioChunks = React.useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recorderInstance.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await handleAudioSubmit(audioBlob);
        // Cerrar el stream para apagar la luz del micro
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Grabando voz...');
    } catch (err) {
      toast.error('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (recorderInstance.current && isRecording) {
      recorderInstance.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmit = async (blob) => {
    setLoading(true);
    setResult(null);
    setLastAudio(null);

    try {
      const data = await howToSay(blob, context, feedbackLang);
      
      setResult(data);
      toast.success('¡Audio procesado!');

      if (isAudioEnabled) {
        const textToSpeak = `${data.translation}. ${data.explanation}`;
        playTutorAudio(textToSpeak);
      }
    } catch (error) {
      console.error("Audio Analysis failed:", error);
      toast.error('Error al procesar el audio');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Por favor escribe algo');
      return;
    }

    setLoading(true);
    setResult(null);
    setLastAudio(null); // Reset audio al cambiar de consulta

    try {
      const data = await howToSay(text, context, feedbackLang);
      setResult(data);
      
      toast.success('¡Traducción lista!');

      if (isAudioEnabled) {
        // Leemos la traducción y la explicación
        const textToSpeak = `${data.translation}. ${data.explanation}`;
        playTutorAudio(textToSpeak);
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      toast.error(error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-8 pt-20">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
              <Languages className="w-10 h-10 text-blue-400" />
              ¿Cómo se dice?
            </h1>
            <p className="text-slate-400 mt-2">Dime o cuéntame una situación para saber cómo expresarla naturalmente.</p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={toggleAudio}
              className={`flex items-center gap-2 rounded-full border-slate-800 transition-all duration-300 ${isAudioEnabled ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'hover:bg-slate-800'}`}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {isAudioEnabled ? 'AUDIO ACTIVADO' : 'AUDIO DESACTIVADO'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Input Section */}
          <div className="lg:col-span-12 space-y-6">
            <Card className="bg-[#121216] border-slate-800/50 p-6 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="w-32 h-32" />
              </div>

              <div className="relative space-y-4">
                <div className="flex items-center justify-between text-sm font-medium text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    TU SITUACIÓN O FRASE
                  </div>
                  <Select value={context} onValueChange={setContext}>
                    <SelectTrigger className="w-[200px] h-8 bg-slate-900 border-slate-800 text-xs">
                      <SelectValue placeholder="Contexto" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      {contexts.map(ctx => (
                        <SelectItem key={ctx.value} value={ctx.value}>{ctx.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative group/textarea">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe o mantén presionado el micrófono para hablar..."
                    className="min-h-[140px] bg-slate-950/50 border-slate-800 focus:border-blue-500/50 focus:ring-blue-500/20 text-lg leading-relaxed resize-none p-6 rounded-2xl pr-16"
                  />
                  
                  {/* WhatsApp Style Mic Button */}
                  <div className="absolute right-4 bottom-4">
                    <motion.button
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      animate={isRecording ? { scale: [1, 1.2, 1], backgroundColor: ["#3b82f6", "#ef4444", "#3b82f6"] } : {}}
                      transition={isRecording ? { repeat: Infinity, duration: 1.5 } : {}}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors overflow-hidden relative ${isRecording ? 'bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      {isRecording && (
                        <motion.div
                          animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 bg-red-400 rounded-full"
                        />
                      )}
                      <Mic className="w-6 h-6 relative z-10" />
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !text.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-blue-900/20 group transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Analizar Texto
                        <Search className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-12 space-y-8 pb-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Translation Card */}
                  <Card className="bg-[#121216] border-slate-800/50 p-6 flex flex-col items-center text-center justify-center space-y-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent" />
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">TE RECOMIENDO DECIR:</div>
                    <div className="text-3xl md:text-4xl font-bold text-white px-4 leading-tight">
                      "{result.translation}"
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => playTutorAudio(`${result.translation}. ${result.explanation}`)}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-full h-12 px-6 gap-2"
                      >
                        <Volume2 className="w-5 h-5" />
                        Escuchar
                      </Button>
                      {lastAudio && (
                        <Button
                          variant="outline"
                          onClick={() => playTutorAudio(lastAudio.text)}
                          className="border-slate-800 hover:bg-slate-800 rounded-full h-12 px-6 gap-2"
                        >
                          <Repeat className="w-5 h-5" />
                          Repetir
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Explanation Card */}
                  <Card className="bg-slate-900/30 border-slate-800/50 p-6 flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold mb-2 uppercase text-sm tracking-widest">
                      <Lightbulb className="w-4 h-4" />
                      Por qué esta frase
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed">
                      {result.explanation}
                    </p>
                  </Card>
                </div>

                {/* Alternatives Section */}
                {result.alternatives && result.alternatives.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-xl font-bold text-white flex items-center gap-2 px-2">
                       Otras alternativas interesantes
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.alternatives.map((alt, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-slate-900/50 border border-slate-800/50 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                        >
                          <span className="text-slate-300 font-medium text-lg leading-snug">
                            {alt}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => playTutorAudio(alt)}
                            className="text-slate-400 hover:text-blue-400 shrink-0 ml-4"
                          >
                            <Volume2 className="w-5 h-5" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};
