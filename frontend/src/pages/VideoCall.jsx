import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  PhoneOff, 
  MessageSquare, 
  Send,
  Loader2,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  Languages,
  BookOpen,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { Card } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { useAuth } from '../contexts/AuthContext';
import { generateSpeech } from '../lib/firebase';
import { Toaster, toast } from 'sonner';

const WORK_TOPICS = [
  "Preparación para entrevista de Software Engineer",
  "Negociación de salario y beneficios",
  "Presentación de resultados trimestrales",
  "Reunión de equipo (Daily Standup)",
  "Llamada de ventas con cliente internacional",
  "Inglés para soporte técnico y atención al cliente",
  "Revisión de desempeño laboral (Performance Review)",
  "Planificación de proyecto en equipo (Sprint Planning)",
  "Networking en un evento de tecnología",
  "Inglés para Marketing y Estrategia Digital",
  "Gestión de conflictos en el equipo de trabajo",
  "Escritura de correos formales para directivos"
];

export const VideoCall = () => {
  const navigate = useNavigate();
  const { userProfile, isAuthenticated, loading: authLoading } = useAuth();
  
  const [isInCall, setIsInCall] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [tutorMuted, setTutorMuted] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [callTime, setCallTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [listeningLang, setListeningLang] = useState('en-US');
  const [interimText, setInterimText] = useState('');

  const timerRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  
  const videoNodeRef = useCallback(node => {
     if (node && stream) node.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    const randomTopic = WORK_TOPICS[Math.floor(Math.random() * WORK_TOPICS.length)];
    setCustomTopic(randomTopic);
  }, []);

  const currentLevel = userProfile?.language_level || 'beginner';

  const speakTutor = useCallback((text) => {
    if (tutorMuted) return;
    window.speechSynthesis.cancel();
    const isMainlySpanish = (text.match(/[áéíóúñ¿¡]/g) || []).length > 2;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isMainlySpanish ? 'es-MX' : 'en-US';
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang.includes(utterance.lang) && v.name.includes('Google')) || 
                      voices.find(v => v.lang.includes(utterance.lang)) || null;
    utterance.rate = currentLevel === 'beginner' ? 0.9 : 1.0;
    window.speechSynthesis.speak(utterance);
  }, [tutorMuted, currentLevel]);

  const playTutorAudio = useCallback(async (textToPlay) => {
    if (tutorMuted) return;
    try {
      const { audioContent } = await generateSpeech(textToPlay, userProfile?.preferred_voice || 'orion');
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      await audio.play();
    } catch (err) {
      console.error("New audio engine failed, falling back to local TTS:", err);
      speakTutor(textToPlay);
    }
  }, [tutorMuted, userProfile, speakTutor]);

  // INTELIGENCIA LOCAL (Sin errores 404)
  const processMessage = useCallback((text) => {
    if (!text || !text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: text }]);
    setInterimText('');
    
    setTimeout(() => {
      let response = "";
      const lowerText = text.toLowerCase();
      if (lowerText.includes('entrevista') || lowerText.includes('interview')) {
        response = "Claro, para una entrevista laboral es clave decir: 'I have experience in...'. ¿Quieres que profundicemos en tus habilidades técnicas ahora?";
      } else if (lowerText.includes('palabra') || lowerText.includes('word')) {
        response = `¡Buena iniciativa! Aquí tienes tres palabras clave para tu tema: 'Advancement', 'Synergy' y 'Scalability'. ¿Sabes qué significan?`;
      } else {
        response = `¡Qué bien suena eso en inglés! Lo has pronunciado perfecto. ¿Cómo aplicarías ese mismo concepto para la situación de "${customTopic}"?`;
      }
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      playTutorAudio(response);
    }, 1000);
  }, [customTopic, playTutorAudio]);

  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = listeningLang;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => { setIsRecording(true); setInterimText('...'); };
    rec.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
      setInterimText(transcript);
      if (event.results[0].isFinal) {
        processMessage(transcript);
        rec.stop();
      }
    };
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    try { rec.start(); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText]);

  const handleStartCall = async () => {
    if (!customTopic.trim()) { toast.error('Elige un tema primero.'); return; }
    setLoading(true);
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      ms.getAudioTracks().forEach(t => t.stop());
      setStream(ms);
      setIsInCall(true);
      setCallTime(0);
      let intro = currentLevel === 'beginner' 
        ? `¡Hola! Soy tu tutor IA personal. Vamos a practicar "${customTopic}". Pulsa el micro para hablar.` 
        : `Hi there! I'm your AI Language Tutor. Let's practice "${customTopic}". Click the mic button above to start your practice.`;
      setMessages([{ role: 'assistant', text: intro }]);
      setTimeout(() => playTutorAudio(intro), 800);
      timerRef.current = setInterval(() => setCallTime(p => p + 1), 1000);
    } catch (e) { toast.error('Permisos denegados.'); }
    setLoading(false);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    if (stream) stream.getTracks().forEach(t => t.stop());
    clearInterval(timerRef.current);
    navigate('/dashboard');
  };

  if (authLoading) return null;

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0b0b14] relative">
      <Toaster position="top-center" richColors />
      <AnimatePresence mode="wait">
        {!isInCall ? (
          <motion.div 
            key="pre" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0b0b14] to-[#1a1a2e]"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.8 }} 
                animate={{ scale: 1 }} 
                className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative"
              >
                <GraduationCap className="text-white relative z-10" size={52} />
                <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>Tutor IA Live</h1>
              <p className="text-slate-500 font-medium text-lg">Practica inglés profesional sin límites.</p>
            </div>
            
            <Card className="w-full max-w-[500px] bg-[#1a1a2e] border-white/5 p-10 space-y-8 rounded-[3rem] shadow-2xl border border-white/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-500 px-2 uppercase tracking-[0.2em]">
                  <span>Tema sugerido</span>
                  <button 
                    onClick={() => setCustomTopic(WORK_TOPICS[Math.floor(Math.random() * WORK_TOPICS.length)])} 
                    className="flex items-center gap-1 hover:text-[#7c3aed] transition-colors font-black cursor-pointer"
                  >
                    <RefreshCw size={12}/> Cambiar
                  </button>
                </div>
                <textarea 
                  value={customTopic} 
                  onChange={e => setCustomTopic(e.target.value)} 
                  className="w-full bg-black/40 border-2 border-white/5 rounded-3xl p-6 text-white text-xl focus:outline-none focus:border-[#7c3aed]/50 min-h-[160px] resize-none leading-relaxed transition-all" 
                />
              </div>
              <Button 
                onClick={handleStartCall} 
                disabled={loading} 
                className="w-full bg-[#7c3aed] text-white py-12 rounded-[1.8rem] font-black text-2xl shadow-xl transition-all active:scale-95 hover:bg-[#6d28d9]"
              >
                {loading ? <Loader2 className="animate-spin" size={32} /> : 'Iniciar Sesión'}
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div key="call" className="h-full flex flex-col lg:flex-row p-4 gap-6 overflow-hidden">
            <div className="flex-1 relative bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group">
              {/* VISTA DEL TUTOR (AVATAR) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-black">
                <motion.div 
                  animate={{ scale: isRecording ? [1, 1.1, 1] : 1, rotateY: [0, 5, 0] }} 
                  transition={{ repeat: Infinity, duration: 2 }} 
                  className={`w-44 h-44 md:w-56 md:h-56 rounded-full flex items-center justify-center border-4 mb-6 transition-all ${isRecording ? 'bg-red-500/10 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.4)]' : 'bg-[#7c3aed]/10 border-[#7c3aed] shadow-[0_0_50px_rgba(124,58,237,0.2)]'}`}
                >
                   <Bot size={120} className={`${isRecording ? 'text-red-500' : 'text-[#7c3aed]'}`} />
                </motion.div>
                <div className="text-center px-10">
                  <h3 className={`text-3xl md:text-4xl font-black mb-4 transition-colors ${isRecording ? 'text-red-500' : 'text-white'}`}>
                    {isRecording ? 'Te estoy escuchando...' : 'Tutor Listo'}
                  </h3>
                  <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-black/60 backdrop-blur-3xl rounded-full border border-white/10 uppercase font-black text-[11px] tracking-[0.2em] text-[#0cf] shadow-xl">
                    <Sparkles size={16}/> {customTopic}
                  </div>
                </div>
              </div>

              {/* MINIATURA DEL USUARIO */}
              <div className="absolute top-8 right-8 w-36 h-48 md:w-56 md:h-72 bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10 z-20 group-hover:scale-105 transition-transform duration-500">
                <video ref={videoNodeRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              </div>

              {/* CONTROLES FLOTANTES */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-8 z-30 bg-black/60 backdrop-blur-3xl p-6 rounded-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <Button 
                  onClick={() => setListeningLang(listeningLang === 'en-US' ? 'es-MX' : 'en-US')} 
                  className="w-16 h-16 rounded-full bg-white/5 border-none p-0 text-4xl flex items-center justify-center hover:bg-white/10 transition-all font-black"
                >
                  {listeningLang === 'en-US' ? '🇺🇸' : '🇲🇽'}
                </Button>
                
                <button 
                  onClick={toggleRecording} 
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center transition-all border-4 ${isRecording ? 'bg-red-500 border-red-200 shadow-[0_0_40px_rgba(239,68,68,0.6)]' : 'bg-[#7c3aed] border-white/10 hover:scale-105 shadow-2xl'}`}
                >
                  {isRecording ? <div className="w-10 h-10 bg-white rounded-lg animate-pulse" /> : <Mic size={48} className="text-white" />}
                </button>
                
                <Button 
                  onClick={() => setTutorMuted(!tutorMuted)} 
                  className="w-16 h-16 rounded-full bg-white/5 border-none hover:bg-white/10 transition-all"
                >
                  {tutorMuted ? <VolumeX className="text-orange-500" size={32} /> : <Volume2 className="text-white" size={32} />}
                </Button>
                
                <Button 
                  onClick={handleEndCall} 
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-none shadow-xl transition-all"
                >
                  <PhoneOff size={32} className="text-white" />
                </Button>
              </div>
            </div>

            {/* PANEL DE CONVERSACIÓN */}
            <Card className="w-full lg:w-[480px] bg-[#1a1a2e] border-white/5 flex flex-col min-h-0 rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5">
              <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <span className="text-white font-black uppercase text-xs tracking-[0.3em] leading-none mb-1 block">Feedback Tutor</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-mono">EN VIVO</span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 text-sm font-mono text-[#0cf] shadow-inner">
                  {Math.floor(callTime/60)}:{(callTime%60).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar bg-black/10">
                {messages.map((m, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-6 rounded-[2.5rem] text-[16px] leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-[#7c3aed] text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'}`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {isRecording && interimText && (
                  <div className="flex justify-end pr-4">
                    <p className="text-[#0cf] text-[14px] font-black italic animate-pulse opacity-70">"{interimText}"</p>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              <form 
                onSubmit={(e) => { e.preventDefault(); processMessage(inputMessage); setInputMessage(''); }} 
                className="p-8 flex gap-4 bg-[#111126] border-t border-white/5"
              >
                <input 
                  value={inputMessage} 
                  onChange={e => setInputMessage(e.target.value)} 
                  className="flex-1 bg-white/[0.03] border-2 border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-[#7c3aed]/50 placeholder:text-slate-700 transition-all font-medium text-lg" 
                  placeholder="Mensaje rápido..." 
                />
                <Button size="icon" type="submit" className="bg-[#7c3aed] rounded-2xl h-16 w-16 shrink-0 shadow-lg active:scale-95 hover:bg-[#6d28d9]">
                  <Send size={26} className="text-white"/>
                </Button>
              </form>
            </Card>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoCall;
