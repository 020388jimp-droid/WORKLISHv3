import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  Play,
  Square,
  RotateCcw,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { updateProgress } from '../lib/utils';
import { practiceVoice, generateSpeech } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

export const VoicePractice = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfile, isAuthenticated, loading: authLoading } = useAuth();
  const { feedbackLang } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expectedText, setExpectedText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    return localStorage.getItem('isAudioEnabled') === 'true';
  });

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const samplePhrases = [
    "I would like to schedule a meeting to discuss the project timeline.",
    "Thank you for your email. I will review the proposal.",
    "Could you please clarify the requirements for this task.",
    "We need to prioritize our goals for the next sprint."
  ];

  useEffect(() => {
    localStorage.setItem('isAudioEnabled', isAudioEnabled);
    if (!isAudioEnabled) window.speechSynthesis.cancel();
  }, [isAudioEnabled]);

  const speak = useCallback((textToSpeak) => {
    if (!isAudioEnabled) return;
    window.speechSynthesis.cancel();
    
    const isMainlySpanish = (textToSpeak.match(/[áéíóúñ¿¡]/g) || []).length > 2;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = isMainlySpanish ? 'es-MX' : 'en-US';
    
    // Asegurar que las voces carguen
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes(utterance.lang) && v.name.includes('Google')) || 
                           voices.find(v => v.lang.includes(utterance.lang));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [isAudioEnabled]);

  const playTutorAudio = async (textToPlay) => {
    if (!isAudioEnabled) return;
    try {
      const { audioContent } = await generateSpeech(textToPlay, userProfile?.preferred_voice || 'orion');
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      await audio.play();
    } catch (err) {
      console.error("New audio engine failed, falling back to local TTS:", err);
      toast.error(`Motor Premium: ${err.message || 'Fallo de conexión'}`);
      // Limpieza de emergencia para el robot de respaldo
      const cleanText = textToPlay.replace(/\*+/g, '');
      speak(cleanText);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setResult(null);

      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) {
      toast.error('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    setLoading(true);

    try {
      const data = await practiceVoice(audioBlob, expectedText.trim() || null, 'business', feedbackLang);
      // Limpiar consejos y feedback para UI y Voz
      const cleanTips = (data.tips || []).map(tip => tip.replace(/^"|"$/g, '').trim());
      const cleanFeedback = data.pronunciation_feedback?.replace(/^"|"$/g, '').trim() || '';
      
      const cleanData = { 
        ...data, 
        tips: cleanTips, 
        pronunciation_feedback: cleanFeedback 
      };

      setResult(cleanData);

      try {
        updateProgress('voice', data.accuracy_score);
      } catch (err) {
        console.error("Progress save failed:", err);
      }

      toast.success('¡Análisis completado!');

      if (isAudioEnabled) {
        const scoreFeedback = `Tu puntaje es de ${data.accuracy_score} por ciento. ${cleanFeedback}`;
        setTimeout(() => playTutorAudio(scoreFeedback), 600);
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      toast.error('Error de conexión con la IA. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAudioBlob(null);
    setResult(null);
    setRecordingTime(0);
    setExpectedText('');
    window.speechSynthesis.cancel();
  };

  if (authLoading) return null;

  return (
    <div className="pb-10 min-h-[calc(100vh-64px)]">
      <Toaster position="top-center" richColors />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 mt-4 px-4 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-6">
           <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] rounded-3xl flex items-center justify-center shadow-2xl relative shrink-0">
             <GraduationCap className="text-white relative z-10" size={48} />
             <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full -z-10 animate-pulse" />
           </div>
           <div>
             <h1 className="text-3xl md:text-5xl font-black text-white leading-none mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Pronunciación</h1>
             <p className="text-slate-500 font-medium">Analizador de voz profesional Gemini.</p>
           </div>
        </motion.div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 pr-4 rounded-2xl backdrop-blur-3xl self-start md:self-auto shadow-xl">
          <div 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${isAudioEnabled ? 'bg-[#06b6d4]' : 'bg-slate-700'}`}
          >
            <motion.div 
               animate={{ x: isAudioEnabled ? 28 : 4 }}
               transition={{ type: "spring", stiffness: 500, damping: 30 }}
               className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-lg flex items-center justify-center ${isAudioEnabled ? 'text-[#06b6d4]' : 'text-slate-400'}`}
            >
              {isAudioEnabled ? <Volume2 size={12}/> : <VolumeX size={12}/>}
            </motion.div>
          </div>
          <span className={`text-[11px] font-black uppercase tracking-widest ${isAudioEnabled ? 'text-[#06b6d4]' : 'text-slate-500'}`}>
            {isAudioEnabled ? 'Audio Activado' : 'Solo Lectura'}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 px-4 max-w-7xl mx-auto items-stretch">
        <div className="space-y-6">
          <Card className="bg-[#1a1a2e] border-white/5 p-8 rounded-[2.5rem] shadow-2xl h-full flex flex-col items-center">
            <div className="text-center mb-10 w-full">
              <motion.div 
                className={`w-36 h-36 rounded-full mx-auto flex items-center justify-center border-4 relative ${isRecording ? 'border-red-500 bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'border-[#06b6d4] bg-[#06b6d4]/10 shadow-xl'}`}
                animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {isRecording ? <div className="absolute inset-0 rounded-full animate-ping bg-red-500/20" /> : null}
                {isRecording ? <MicOff className="text-red-500 z-10" size={48} /> : <Mic className="text-[#06b6d4] z-10" size={48} />}
              </motion.div>
              <p className="mt-8 text-white font-mono text-4xl font-black tracking-tighter text-center">
                {Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2, '0')}
              </p>
              
              <div className="mt-8 flex justify-center gap-6">
                {!isRecording ? (
                  <Button onClick={startRecording} className="bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-2xl h-18 w-18 md:w-52 md:rounded-full font-black text-lg shadow-xl shrink-0 transition-all active:scale-95">
                    <Play className="md:mr-2" size={24}/> <span className="hidden md:inline">Grabar</span>
                  </Button>
                ) : (
                  <Button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-18 w-18 md:w-52 md:rounded-full font-black text-lg shadow-xl shrink-0 transition-all active:scale-95">
                    <Square className="md:mr-2" size={24}/> <span className="hidden md:inline">Parar</span>
                  </Button>
                )}
                {audioBlob && !isRecording && (
                   <Button onClick={handleReset} variant="outline" className="border-2 border-white/10 text-slate-400 h-18 w-18 rounded-2xl transition-all active:rotate-180 duration-500 hover:text-white">
                     <RotateCcw size={28}/>
                   </Button>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6 w-full">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Texto de Práctica (Opcional)</label>
               <Textarea 
                placeholder="Escribe lo que vas a intentar decir..." 
                value={expectedText} 
                onChange={(e) => setExpectedText(e.target.value)}
                className="bg-black/40 border-2 border-white/5 text-white rounded-[1.5rem] p-6 text-lg leading-relaxed focus:border-[#06b6d4]/50 transition-all resize-none min-h-[160px]"
              />
            </div>

            {audioBlob && !isRecording && (
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#7c3aed] text-white h-18 rounded-[1.5rem] font-black text-xl shadow-xl hover:bg-[#6d28d9] transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={28}/> : <><Sparkles size={24}/> Analizar Voz</>}
              </Button>
            )}
          </Card>
        </div>

        <div className="h-full">
          <Card className="bg-[#1a1a2e] border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col h-full relative overflow-hidden border border-white/5">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 h-full flex flex-col justify-start">
                  <div className="text-center p-8 bg-black/30 rounded-[2rem] border border-white/5 shadow-inner">
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Accuracy Score</p>
                    <div className="relative inline-flex items-center justify-center mb-2">
                       <span className="text-8xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{result.accuracy_score}<span className="text-2xl text-[#10b981]">%</span></span>
                       <div className="absolute inset-0 bg-[#10b981]/10 blur-3xl rounded-full -z-10" />
                    </div>
                    <Progress value={result.accuracy_score} className="h-3 bg-white/5 rounded-full shadow-inner overflow-hidden" />
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2 text-[#06b6d4]"><CheckCircle size={14}/> Transcripción Exacta</h3>
                      <div className="p-5 bg-white/[0.03] rounded-2xl text-slate-300 text-lg italic leading-relaxed font-medium">"{result.transcribed_text}"</div>
                    </div>
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 text-[#f59e0b]"><Lightbulb size={14}/> Feedback del Tutor</h3>
                        <Button 
                           onClick={() => playTutorAudio(`Tu puntaje es de ${result.accuracy_score} por ciento. ${result.pronunciation_feedback}`)}
                           variant="ghost" 
                           size="sm"
                           className="text-[#f59e0b] hover:bg-[#f59e0b]/10 p-2 h-auto"
                        >
                           <Volume2 size={24}/>
                        </Button>
                      </div>
                      <div className="p-6 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-2xl text-slate-400 text-md leading-relaxed relative">
                        {result.pronunciation_feedback}
                        <div className="absolute top-2 right-2 opacity-20"><Sparkles size={20} className="text-[#f59e0b]"/></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                  <div className="flex flex-col items-center space-y-4">
                    {samplePhrases.map((phrase, i) => (
                      <button 
                        key={i} 
                        onClick={() => setExpectedText(phrase)}
                        className="w-full bg-white/[0.03] border border-white/5 p-4 rounded-2xl text-left text-sm text-slate-500 hover:text-white hover:border-[#06b6d4]/30 transition-all font-medium group flex items-center justify-between"
                      >
                         <span className="truncate pr-4">"{phrase}"</span>
                         <ChevronRight size={16} className="text-[#06b6d4] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </button>
                    ))}
                  </div>
                  <div className="pt-4">
                    <h3 className="text-white text-xl font-black">Sugerencias de Práctica</h3>
                    <p className="text-slate-600 max-w-[260px] text-sm font-medium mt-1">Selecciona una frase o escribe la tuya para comenzar el análisis.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#06b6d4]/5 blur-[80px] rounded-full" />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoicePractice;
