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
import { updateProgress, canPractice } from '../lib/utils';
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

    if (!canPractice('voice', userProfile)) {
      toast.error(t('common.limit_reached') || 'Has alcanzado el límite diario para tu plan.');
      navigate('/pricing');
      return;
    }

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
        const scorePrefix = feedbackLang === 'en' ? `Your score is ` : `Tu puntaje es de `;
        const percentSuffix = feedbackLang === 'en' ? ` percent. ` : ` por ciento. `;
        const scoreFeedback = `${scorePrefix}${data.accuracy_score}${percentSuffix}${cleanFeedback}`;
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

  // —————————————————————————————————————————
  // Helper: Clickable English Words (same as VideoCall)
  // —————————————————————————————————————————
  const renderMessageText = (text, type = 'feedback') => {
    if (!text) return null;
    const parts = text.split(/(\([^)]+\))/g);
    
    return parts.map((part, index) => {
      // Check if this part is an English word enclosed in parentheses
      if (part.startsWith('(') && part.endsWith(')')) {
        const cleanWord = part.slice(1, -1).trim(); // Remove parentheses
        const isSp = /[áéíóúñÁÉÍÓÚÑ¿¡]/.test(cleanWord);
        
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.speechSynthesis.cancel();
              const utter = new SpeechSynthesisUtterance(cleanWord);
              utter.lang = isSp ? 'es-MX' : 'en-US';
              const voices = window.speechSynthesis.getVoices();
              utter.voice = voices.find(v => v.lang.startsWith(isSp ? 'es' : 'en') && v.name.includes('Google')) ||
                            voices.find(v => v.lang.startsWith(isSp ? 'es' : 'en')) || null;
                            
              window.speechSynthesis.speak(utter);
            }}
            className={`font-black tracking-wide inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md transition-all active:scale-95 cursor-pointer shadow-sm ${
              type === 'transcription' 
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20' 
                : 'bg-[#06b6d4]/20 hover:bg-[#06b6d4]/40 text-[#06f] border border-[#06b6d4]/50 hover:border-[#06b6d4]/80'
            }`}
            title="Escuchar pronunciación"
          >
            <Volume2 size={13} strokeWidth={3} className="opacity-80" />
            {cleanWord}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (authLoading) return null;

  return (
    <div className="pb-10 min-h-[calc(100vh-64px)] max-w-7xl mx-auto px-4">
      <Toaster position="top-center" richColors />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 mt-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 md:gap-8">
           <div className="w-16 h-16 md:w-28 md:h-28 bg-gradient-to-tr from-[#06b6d4] to-[#7c3aed] rounded-[2rem] flex items-center justify-center shadow-2xl relative shrink-0 ring-4 ring-white/5">
             <GraduationCap className="text-white relative z-10 w-8 h-8 md:w-14 md:h-14" />
             <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full -z-10 animate-pulse" />
           </div>
           <div>
             <h1 className="text-3xl md:text-6xl font-black text-white leading-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Pronunciación</h1>
             <p className="text-slate-400 font-medium text-sm md:text-xl">Analizador de voz profesional Gemini.</p>
           </div>
        </motion.div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 pr-5 rounded-2xl backdrop-blur-3xl self-start md:self-auto shadow-xl ring-1 ring-white/5">
          <div 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-500 ease-in-out ${isAudioEnabled ? 'bg-gradient-to-r from-[#06b6d4] to-[#0891b2]' : 'bg-slate-700'}`}
          >
            <motion.div 
               animate={{ x: isAudioEnabled ? 28 : 4 }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
               className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-lg flex items-center justify-center ${isAudioEnabled ? 'text-[#06b6d4]' : 'text-slate-400'}`}
            >
              {isAudioEnabled ? <Volume2 size={12} strokeWidth={3}/> : <VolumeX size={12} strokeWidth={3}/>}
            </motion.div>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isAudioEnabled ? 'text-white' : 'text-slate-500'}`}>
            {isAudioEnabled ? 'Audio Activado' : 'Solo Lectura'}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        <div className="h-full">
          <Card className="bg-[#1a1a2e]/60 border-white/10 p-6 md:p-10 rounded-[2.5rem] shadow-2xl h-full flex flex-col items-center backdrop-blur-xl ring-1 ring-white/5">
            <div className="text-center mb-10 w-full">
              <motion.div 
                className={`w-32 h-32 md:w-48 md:h-48 rounded-full mx-auto flex items-center justify-center border-4 md:border-8 relative transition-all duration-500 ${isRecording ? 'border-red-500 bg-red-500/10 shadow-[0_0_60px_rgba(239,68,68,0.2)]' : 'border-[#06b6d4]/40 bg-[#06b6d4]/5 shadow-2xl shadow-[#06b6d4]/10'}`}
                animate={isRecording ? { scale: [1, 1.02, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {isRecording ? <div className="absolute inset-0 rounded-full animate-ping bg-red-500/20" /> : null}
                {isRecording ? <MicOff className="text-red-500 z-10 w-12 h-12 md:w-16 md:h-16" /> : <Mic className="text-[#06b6d4] z-10 w-12 h-12 md:w-16 md:h-16" />}
              </motion.div>
              <p className="mt-8 text-white font-['Outfit'] text-4xl md:text-6xl font-black tracking-tighter text-center">
                {Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2, '0')}
              </p>
              
              <div className="mt-10 flex justify-center gap-4 md:gap-8">
                {!isRecording ? (
                  <Button onClick={startRecording} className="bg-gradient-to-r from-[#06b6d4] to-[#0891b2] hover:from-[#0891b2] hover:to-[#0e7490] text-white rounded-2xl h-16 md:h-20 px-10 md:px-16 font-black text-xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] shrink-0 transition-all active:scale-[0.98] border-0">
                    <Play className="mr-3 w-6 h-6 md:w-8 md:h-8" strokeWidth={3}/> Grabar
                  </Button>
                ) : (
                  <Button onClick={stopRecording} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl h-16 md:h-20 px-10 md:px-16 font-black text-xl shadow-[0_10px_30px_rgba(239,68,68,0.3)] shrink-0 transition-all active:scale-[0.98] border-0">
                    <Square className="mr-3 w-6 h-6 md:w-8 md:h-8" fill="currentColor"/> Parar
                  </Button>
                )}
                {audioBlob && !isRecording && (
                   <Button onClick={handleReset} variant="outline" className="border-2 border-white/10 text-slate-500 h-16 w-16 md:h-20 md:w-20 rounded-2xl transition-all active:rotate-180 duration-700 hover:text-white bg-black/20">
                     <RotateCcw size={32} strokeWidth={3}/>
                   </Button>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-8 w-full">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2 text-center block">Referencia de Lectura</label>
               <Textarea 
                placeholder="¿Qué vas a decir? (Opcional)" 
                value={expectedText} 
                onChange={(e) => setExpectedText(e.target.value)}
                className="bg-black/40 border-2 border-white/5 text-white rounded-[2rem] p-6 md:p-8 text-base md:text-xl leading-relaxed focus:border-[#06b6d4]/50 transition-all resize-none min-h-[160px] font-medium placeholder:text-slate-800 shadow-inner"
              />
            </div>

            {audioBlob && !isRecording && (
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white h-18 md:h-24 rounded-[2rem] font-black text-xl md:text-2xl shadow-[0_15px_40px_rgba(124,58,237,0.3)] hover:scale-[1.01] transition-all flex items-center justify-center gap-4 border-0">
                {loading ? <Loader2 className="animate-spin" size={32}/> : <><Sparkles size={28} strokeWidth={2.5}/> Analizar con Gemini</>}
              </Button>
            )}
          </Card>
        </div>

        <div className="h-full">
          <Card className="bg-[#1a1a2e]/80 border-white/10 p-6 md:p-10 rounded-[2.5rem] shadow-2xl flex flex-col h-full relative overflow-hidden backdrop-blur-2xl ring-1 ring-white/5">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 h-full flex flex-col justify-start relative z-10">
                  <div className="text-center p-8 md:p-12 bg-gradient-to-br from-black/20 to-black/40 rounded-[3rem] border border-white/5 shadow-inner relative group overflow-hidden">
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.5em] mb-6 relative z-10">Puntaje de Precisión</p>
                    <div className="relative inline-flex items-center justify-center mb-4 z-10">
                       <span className="text-7xl md:text-9xl font-black text-white tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>
                         {result.accuracy_score}
                         <span className="text-2xl md:text-4xl text-[#10b981] ml-1">%</span>
                       </span>
                    </div>
                    <Progress value={result.accuracy_score} className="h-2.5 bg-white/5 rounded-full shadow-inner overflow-hidden relative z-10 mx-auto" />
                    <div className="absolute inset-0 bg-[#06b6d4]/5 blur-[80px] rounded-full -z-10 group-hover:bg-[#06b6d4]/10 transition-all duration-700" />
                  </div>
                  
                  <div className="space-y-8 flex-1">
                    <div>
                      <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-4 flex items-center gap-2 text-[#06b6d4]"><CheckCircle size={14} strokeWidth={3}/> Transcripción Exacta</h3>
                      <div className="p-6 md:p-8 bg-white/[0.03] border border-white/5 rounded-3xl text-slate-200 text-lg md:text-xl italic leading-relaxed font-semibold shadow-xl relative">
                        <span className="absolute -top-4 -left-2 text-6xl text-white/5 font-serif">"</span>
                        {renderMessageText(result.transcribed_text, 'transcription')}
                        <span className="absolute -bottom-10 -right-2 text-6xl text-white/5 font-serif rotate-180">"</span>
                      </div>
                    </div>
                    
                    <div className="relative pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 text-[#f59e0b]"><Lightbulb size={16} strokeWidth={3}/> Análisis del Tutor</h3>
                        <Button 
                           onClick={() => playTutorAudio(`Tu puntaje es de ${result.accuracy_score} por ciento. ${result.pronunciation_feedback}`)}
                           variant="ghost" 
                           size="sm"
                           className="text-[#f59e0b] hover:bg-[#f59e0b]/10 p-3 h-auto rounded-xl border border-[#f59e0b]/20"
                        >
                           <Volume2 size={24} strokeWidth={2.5}/>
                        </Button>
                      </div>
                      <div className="p-6 md:p-8 bg-gradient-to-br from-[#f59e0b]/5 to-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-3xl text-slate-300 text-sm md:text-base leading-relaxed font-semibold shadow-2xl relative">
                        {renderMessageText(result.pronunciation_feedback, 'feedback')}
                        <div className="absolute top-4 right-4 opacity-20"><Sparkles size={24} className="text-[#f59e0b]"/></div>
                      </div>
                    </div>
                  </div>
                </motion.div>

              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-12 py-10 md:py-20 relative z-10">
                  <div className="w-full space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] text-center mb-8">Sugerencias de Práctica</p>
                    <div className="grid gap-3">
                      {samplePhrases.map((phrase, i) => (
                        <button 
                          key={i} 
                          onClick={() => setExpectedText(phrase)}
                          className="w-full bg-white/[0.02] border border-white/5 p-5 md:p-6 rounded-2xl text-left text-sm text-slate-500 hover:text-white hover:border-[#06b6d4]/40 transition-all font-semibold group flex items-center justify-between ring-1 ring-white/5 relative overflow-hidden"
                        >
                           <div className="absolute inset-0 bg-[#06b6d4]/0 group-hover:bg-[#06b6d4]/5 transition-all duration-500" />
                           <span className="truncate pr-4 relative z-10">"{phrase}"</span>
                           <ChevronRight size={18} className="text-[#06b6d4] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 relative z-10" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-center pt-8">
                    <div className="inline-flex items-center gap-2 bg-[#06b6d4]/10 px-4 py-2 rounded-full mb-6 border border-[#06b6d4]/20 animate-pulse">
                      <Sparkles size={14} className="text-[#06b6d4]" />
                      <span className="text-[10px] font-black text-[#06b6d4] uppercase tracking-widest">IA Analizer Ready</span>
                    </div>
                    <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Escucha y Aprende</h3>
                    <p className="text-slate-500 max-w-sm mx-auto font-semibold text-sm md:text-base leading-relaxed">Graba tu voz y recibe una corrección fonética instantánea basada en el contexto profesional.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
            {/* Background decorative elements */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#06b6d4]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#7c3aed]/5 blur-[120px] rounded-full pointer-events-none" />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoicePractice;
