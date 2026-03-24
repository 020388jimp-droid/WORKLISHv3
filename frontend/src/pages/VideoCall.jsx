import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Send,
  Loader2,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  RefreshCw,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { useAuth } from '../contexts/AuthContext';
import { videoCall as videoCallAPI, generateSpeech } from '../lib/firebase';
import { Toaster, toast } from 'sonner';

const WORK_TOPICS = [
  "Job Interview for Software Engineer",
  "Salary & Benefits Negotiation",
  "Presenting Quarterly Results",
  "Team Daily Standup Meeting",
  "Sales Call with International Client",
  "Technical Support & Customer Service",
  "Performance Review Discussion",
  "Sprint Planning in English",
  "Tech Conference Networking",
  "Digital Marketing & Strategy",
  "Conflict Resolution in the Workplace",
  "Writing Formal Emails to Executives"
];

export const VideoCall = () => {
  const navigate = useNavigate();
  const { userProfile, isAuthenticated, loading: authLoading } = useAuth();

  // — UI State —
  const [isInCall, setIsInCall] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [tutorMuted, setTutorMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [customTopic, setCustomTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [callTime, setCallTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [listeningLang, setListeningLang] = useState('en-US');
  const [interimText, setInterimText] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [stream, setStream] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // — Refs —
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const currentAudioRef = useRef(null);
  const silenceTimerRef = useRef(null);     // para capturar oraciones completas
  const conversationHistoryRef = useRef([]); // evita closure stale en async callbacks
  const lastTranscriptRef = useRef('');

  // — Init random topic —
  useEffect(() => {
    setCustomTopic(WORK_TOPICS[Math.floor(Math.random() * WORK_TOPICS.length)]);
  }, []);

  const currentLevel = userProfile?.language_level || 'beginner';
  const feedbackLang = currentLevel === 'beginner' ? 'es' : 'en';

  // ─────────────────────────────────────────
  // TTS: browser fallback BILINGÜE
  // Divide el texto en segmentos: patrón (texto) = inglés, el resto = español
  // ─────────────────────────────────────────
  const speakLocal = useCallback((text) => {
    if (tutorMuted) return;
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const rate = currentLevel === 'beginner' ? 0.88 : 1.0;

    // Obtener la mejor voz disponible para un idioma dado
    const getBestVoice = (lang) =>
      voices.find(v => v.lang.startsWith(lang) && v.name.includes('Google')) ||
      voices.find(v => v.lang.startsWith(lang)) ||
      null;

    // Dividir el texto en segmentos: (entre paréntesis) = inglés, el resto = español
    const segments = [];
    const segRegex = /\(([^)]+)\)|([^(]+)/g;
    let match;
    while ((match = segRegex.exec(text)) !== null) {
      if (match[1] !== undefined) {
        // Texto entre paréntesis → inglés (a menos que tenga letras españolas)
        const hasSpanish = /[áéíóúñÁÉÍÓÚÑ¿¡]/.test(match[1]);
        segments.push({ text: match[1].trim(), lang: hasSpanish ? 'es' : 'en' });
      } else if (match[2] && match[2].trim()) {
        segments.push({ text: match[2].trim(), lang: 'es' });
      }
    }

    // Si no hay segmentos o el texto es all-English, detectar automáticamente
    if (segments.length === 0) {
      const isSpanish = (text.match(/[áéíóúñ¿¡]/g) || []).length > 2;
      segments.push({ text, lang: isSpanish ? 'es' : 'en' });
    }

    let i = 0;
    setIsSpeaking(true);

    const speakNext = () => {
      if (i >= segments.length) {
        setIsSpeaking(false);
        return;
      }
      const seg = segments[i++];
      if (!seg.text) { speakNext(); return; }

      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = seg.lang === 'en' ? 'en-US' : 'es-MX';
      utterance.voice = getBestVoice(seg.lang === 'en' ? 'en' : 'es');
      utterance.rate = rate;
      utterance.onend = speakNext;
      utterance.onerror = () => { setIsSpeaking(false); };
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  }, [tutorMuted, currentLevel]);

  // ─────────────────────────────────────────
  // TTS: premium voice with fallback
  // ─────────────────────────────────────────
  const playTutorAudio = useCallback(async (text) => {
    if (tutorMuted) return;
    // stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(true);
    try {
      const { audioContent } = await generateSpeech(text, userProfile?.preferred_voice || 'orion');
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      currentAudioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); currentAudioRef.current = null; };
      await audio.play();
    } catch (err) {
      console.warn('Premium TTS failed, using browser TTS:', err.message);
      speakLocal(text);
    }
  }, [tutorMuted, userProfile, speakLocal]);

  // ─────────────────────────────────────────
  // REAL AI RESPONSE  (usa ref para evitar closure stale)
  // ─────────────────────────────────────────
  const getAIResponse = useCallback(async (userText) => {
    setAiLoading(true);
    // Leer historial desde ref para evitar valor desactualizado del closure
    const currentHistory = conversationHistoryRef.current;
    const newHistory = [...currentHistory, { role: 'user', content: userText }];

    try {
      const data = await videoCallAPI(
        userText,
        newHistory,
        customTopic,
        feedbackLang
      );

      const aiText = data.ai_response || data.response || data.message || data.text || 'Lo siento, no pude procesar eso. ¿Puedes repetirlo?';
      const tips = data.tips || [];
      const corrections = data.corrections || [];

      const updatedHistory = [...newHistory, { role: 'assistant', content: aiText }];
      conversationHistoryRef.current = updatedHistory;
      setConversationHistory(updatedHistory);
      setMessages(prev => [...prev, { role: 'assistant', text: aiText, tips, corrections }]);
      playTutorAudio(aiText);
    } catch (err) {
      console.error('AI API error:', err.message);
      toast.error('Error de conexión con la IA. Usando modo offline.');
      // Fallback inteligente
      const lowerText = userText.toLowerCase();
      let fallback = '';
      if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hola')) {
        fallback = `Great to meet you! Let's dive into our topic: "${customTopic}". How familiar are you with this subject?`;
      } else if (lowerText.includes('help') || lowerText.includes('ayuda')) {
        fallback = `Of course! For "${customTopic}", key phrases are: "I'd like to discuss...", "My main concern is...", "Could we explore...?" Which feels most natural?`;
      } else if (lowerText.includes('word') || lowerText.includes('vocabular')) {
        fallback = `Great! 3 power words for this topic: "leverage", "streamline", "collaborate". Try using one in a sentence!`;
      } else {
        fallback = `Good effort! You said: "${userText}". In a professional context about "${customTopic}", how would you expand on that idea?`;
      }
      const updatedHistory = [...newHistory, { role: 'assistant', content: fallback }];
      conversationHistoryRef.current = updatedHistory;
      setConversationHistory(updatedHistory);
      setMessages(prev => [...prev, { role: 'assistant', text: fallback }]);
      playTutorAudio(fallback);
    } finally {
      setAiLoading(false);
    }
  }, [customTopic, feedbackLang, playTutorAudio]);

  // ─────────────────────────────────────────
  // PROCESS USER MESSAGE
  // ─────────────────────────────────────────
  const processMessage = useCallback((text) => {
    if (!text || !text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setInterimText('');
    getAIResponse(text.trim());
  }, [getAIResponse]);

  // ─────────────────────────────────────────
  // SPEECH RECOGNITION  (continuous + silence timer)
  // ─────────────────────────────────────────
  const stopRecording = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
  }, []);

  const toggleRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
      return;
    }

    if (isRecording) {
      stopRecording();
      return;
    }

    // Detener TTS antes de escuchar
    window.speechSynthesis.cancel();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);

    const rec = new SpeechRecognition();
    rec.lang = listeningLang;
    rec.continuous = true;         // captura múltiples frases sin cortarse
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsRecording(true);
      setInterimText('🎤 Escuchando...');
      lastTranscriptRef.current = '';
    };

    rec.onresult = (event) => {
      let tempText = '';
      
      // Chrome Android Mobile a veces no reinicia event.results con continuous:true
      // por lo que cada nueva entrada puede traer TODO el historial repetido.
      for (let i = 0; i < event.results.length; i++) {
        let chunk = event.results[i][0].transcript.trim();
        
        // Limpiamos espacios y pasamos a minúscula para una comparación justa
        let cleanTemp = tempText.trim().toLowerCase();
        let cleanChunk = chunk.toLowerCase();

        if (cleanTemp && cleanChunk.startsWith(cleanTemp)) {
          // Si el nuevo fragmento YA INCLUYE todo lo que tenemos (Bug Android),
          // simplemente lo reemplazamos en lugar de sumarlo.
          tempText = chunk;
        } else {
          // Comportamiento normal (Desktop Chrome): sumar el nuevo fragmento
          tempText += (tempText ? ' ' : '') + chunk;
        }
      }
      
      const fullText = tempText.replace(/\s+/g, ' ').trim();
      setInterimText(fullText);
      lastTranscriptRef.current = fullText;

      // Reiniciar timer de silencio cada vez que llega audio
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        rec.stop();
      }, 2500); // 2.5 s de silencio = enviar
    };

    rec.onerror = (event) => {
      console.error('Speech error:', event.error);
      clearTimeout(silenceTimerRef.current);
      if (event.error === 'not-allowed') {
        toast.error('Permiso de micrófono denegado. Revisa la config del navegador.');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error(`Error de reconocimiento: ${event.error}`);
      }
      setIsRecording(false);
      setInterimText('');
    };

    rec.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setIsRecording(false);
      const textToSend = lastTranscriptRef.current.trim();
      if (textToSend) {
        setInterimText('');
        lastTranscriptRef.current = '';
        processMessage(textToSend);
      } else {
        setInterimText('');
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      console.error('Recognition start error:', e);
      toast.error('No se pudo iniciar el micrófono.');
    }
  }, [isRecording, listeningLang, processMessage, stopRecording]);

  // ─────────────────────────────────────────
  // CAMERA — callback ref para evitar race condition de timing
  // El stream puede llegar ANTES o DESPUÉS de que el <video> se monte al DOM
  // ─────────────────────────────────────────

  // Ref al elemento <video> que también adjunta el stream cuando se monta
  const videoCallbackRef = useCallback((node) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.play().catch(e => console.warn('Video play error:', e));
    }
  }, [stream]); // se re-ejecuta si cambia el stream

  // Seguro adicional: si el stream cambia DESPUÉS de que el nodo ya está montado
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [stream]);

  const toggleCamera = useCallback(() => {
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    const enabled = !cameraOn;
    videoTracks.forEach(t => { t.enabled = enabled; });
    setCameraOn(enabled);
  }, [stream, cameraOn]);

  // ─────────────────────────────────────────
  // START / END CALL
  // ─────────────────────────────────────────
  const handleStartCall = async () => {
    if (!customTopic.trim()) {
      toast.error('Por favor escribe o selecciona un tema primero.');
      return;
    }
    setLoading(true);
    setCameraError(null);

    let mediaStream = null;

    // Try camera + mic first
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (camErr) {
      console.warn('Camera permission denied or unavailable:', camErr.message);
      // Try audio-only fallback
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: false });
      } catch {
        // No media at all — continue without camera
      }
      setCameraError('Cámara no disponible. Continuando sin video.');
      toast.warning('Cámara no disponible. La sesión continuará sin video.');
    }

    setStream(mediaStream);
    setIsInCall(true);
    setCallTime(0);
    setMessages([]);
    setConversationHistory([]);
    conversationHistoryRef.current = [];

    const intro = currentLevel === 'beginner'
      ? `¡Hola! Soy tu Tutor IA de inglés profesional. Hoy practicaremos: "${customTopic}". Pulsa el micrófono para hablar, o escribe en el chat. ¡Empecemos!`
      : `Hello! I'm your AI English Tutor. Today we'll practice: "${customTopic}". Press the mic to speak or type in the chat. Let's get started!`;

    const introHistory = [{ role: 'assistant', content: intro }];
    conversationHistoryRef.current = introHistory;
    setMessages([{ role: 'assistant', text: intro }]);
    setConversationHistory(introHistory);
    setTimeout(() => playTutorAudio(intro), 600);

    timerRef.current = setInterval(() => setCallTime(p => p + 1), 1000);
    setLoading(false);
  };

  const handleEndCall = useCallback(() => {
    // Stop recognition
    recognitionRef.current?.stop();
    // Stop TTS
    window.speechSynthesis.cancel();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    // Stop media tracks
    if (stream) stream.getTracks().forEach(t => t.stop());
    // Stop timer
    clearInterval(timerRef.current);

    setIsInCall(false);
    setStream(null);
    setMessages([]);
    setConversationHistory([]);
    navigate('/dashboard');
  }, [stream, navigate]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText, aiLoading]);

  if (authLoading) return null;

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─────────────────────────────────────────
  // Helper: Clickable English Words
  // ─────────────────────────────────────────
  const renderMessageText = (text, role) => {
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
              role === 'user' 
                ? 'bg-white/20 hover:bg-white/30 text-white border border-white/20' 
                : 'bg-[#7c3aed]/20 hover:bg-[#7c3aed]/40 text-[#c4a5ff] border border-[#7c3aed]/50 hover:border-[#7c3aed]/80'
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

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0b0b14] relative">
      <Toaster position="top-center" richColors />
      <AnimatePresence mode="wait">

        {/* ── PRE-CALL SCREEN ── */}
        {!isInCall ? (
          <motion.div
            key="pre"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0b0b14] to-[#1a1a2e]"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.7, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative"
              >
                <GraduationCap className="text-white relative z-10" size={52} />
                <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Tutor IA Live
              </h1>
              <p className="text-slate-500 font-medium text-lg">Practica inglés profesional con inteligencia artificial real.</p>
            </div>

            <Card className="w-full max-w-[520px] bg-[#1a1a2e] border-white/5 p-10 space-y-8 rounded-[3rem] shadow-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-500 px-2 uppercase tracking-[0.2em]">
                  <span>Escenario de práctica</span>
                  <button
                    onClick={() => setCustomTopic(WORK_TOPICS[Math.floor(Math.random() * WORK_TOPICS.length)])}
                    className="flex items-center gap-1 hover:text-[#7c3aed] transition-colors font-black cursor-pointer"
                  >
                    <RefreshCw size={12} /> Cambiar
                  </button>
                </div>
                <textarea
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  className="w-full bg-black/40 border-2 border-white/5 rounded-3xl p-6 text-white text-xl focus:outline-none focus:border-[#7c3aed]/50 min-h-[120px] resize-none leading-relaxed transition-all"
                  placeholder="Escribe o edita el tema de práctica..."
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-sm font-medium">Idioma de reconocimiento:</span>
                <button
                  onClick={() => setListeningLang(l => l === 'en-US' ? 'es-MX' : 'en-US')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all"
                >
                  <img src={listeningLang === 'en-US' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/mx.png"} alt={listeningLang} className="w-5 h-auto rounded-sm" />
                  {listeningLang === 'en-US' ? 'Inglés' : 'Español'}
                </button>
              </div>

              <Button
                onClick={handleStartCall}
                disabled={loading}
                className="w-full bg-[#7c3aed] text-white py-12 rounded-[1.8rem] font-black text-2xl shadow-xl transition-all active:scale-95 hover:bg-[#6d28d9]"
              >
                {loading
                  ? <><Loader2 className="animate-spin inline mr-2" size={28} /> Conectando...</>
                  : '🚀 Iniciar Sesión con Tutor IA'}
              </Button>

              <p className="text-center text-slate-600 text-xs">
                Se solicitará acceso a cámara y micrófono. Puedes continuar sin cámara si es necesario.
              </p>
            </Card>
          </motion.div>

        ) : (

          /* ── IN-CALL SCREEN ── */
          <motion.div
            key="call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col lg:flex-row p-3 md:p-4 gap-3 md:gap-4 overflow-hidden"
          >
            {/* LEFT: Tutor + User video */}
            <div className="relative bg-black rounded-3xl lg:rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group h-[40vh] min-h-[260px] lg:min-h-[400px] lg:h-auto lg:flex-1 shrink-0">

              {/* Tutor avatar */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-black">
                <motion.div
                  animate={{
                    scale: isSpeaking ? [1, 1.05, 1] : isRecording ? [1, 1.08, 1] : 1,
                  }}
                  transition={{ repeat: Infinity, duration: isSpeaking ? 0.5 : 2 }}
                  className={`w-32 h-32 md:w-44 md:h-44 rounded-full flex items-center justify-center border-4 mb-4 md:mb-6 transition-all ${isRecording
                      ? 'bg-red-500/10 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.4)]'
                      : isSpeaking
                        ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_80px_rgba(6,182,212,0.4)]'
                        : 'bg-[#7c3aed]/10 border-[#7c3aed] shadow-[0_0_50px_rgba(124,58,237,0.2)]'
                    }`}
                >
                  <Bot
                    size={72}
                    className={
                      isRecording ? 'text-red-500' : isSpeaking ? 'text-cyan-400' : 'text-[#7c3aed]'
                    }
                  />
                </motion.div>

                {/* Texto + tema — con margen inferior para no quedar bajo los controles */}
                <div className="text-center px-6 pb-20">
                  <h3 className={`text-2xl md:text-3xl font-black mb-3 transition-colors ${isRecording ? 'text-red-400' : isSpeaking ? 'text-cyan-400' : aiLoading ? 'text-yellow-400' : 'text-white'
                    }`}>
                    {isRecording ? '🎤 Escuchándote...' : isSpeaking ? '🔊 Tutor hablando...' : aiLoading ? '⏳ Pensando...' : 'Tutor Listo'}
                  </h3>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 font-bold text-[11px] tracking-[0.1em] text-[#0cf] shadow-xl max-w-[80%] truncate">
                    <Sparkles size={12} /> {customTopic}
                  </div>
                </div>
              </div>

              {/* User's camera thumbnail */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 w-24 h-32 md:w-36 md:h-48 bg-black rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border-2 md:border-4 border-white/10 z-20 group-hover:scale-105 transition-transform duration-500">
                {cameraError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a2e] gap-2">
                    <VideoOff size={28} className="text-slate-500" />
                    <span className="text-slate-600 text-[10px] text-center px-2">Sin cámara</span>
                  </div>
                ) : (
                  <video
                    ref={videoCallbackRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-300 ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transform: 'scaleX(-1)' }}
                  />
                )}
                {!cameraOn && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
                    <VideoOff size={28} className="text-slate-500" />
                  </div>
                )}
              </div>

              {/* Camera error notice */}
              {cameraError && (
                <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full z-30">
                  <AlertCircle size={14} className="text-orange-400" />
                  <span className="text-orange-400 text-xs font-bold">Sin video</span>
                </div>
              )}

              {/* ── Controles flotantes compactos ── */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-black/75 backdrop-blur-2xl px-4 py-3 rounded-full border border-white/10 shadow-2xl">

                {/* Lang toggle — pequeño */}
                <button
                  onClick={() => setListeningLang(l => l === 'en-US' ? 'es-MX' : 'en-US')}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-all overflow-hidden p-[2px]"
                  title={listeningLang === 'en-US' ? 'Cambiar a Español' : 'Switch to English'}
                >
                  <img src={listeningLang === 'en-US' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/mx.png"} alt={listeningLang} className="w-full h-full object-cover rounded-full" />
                </button>

                {/* SEPARADOR */}
                <div className="w-px h-6 bg-white/10" />

                {/* MIC — botón principal, más grande pero no gigante */}
                <button
                  onClick={toggleRecording}
                  disabled={aiLoading}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
                      ? 'bg-red-500 border-red-300 shadow-[0_0_24px_rgba(239,68,68,0.7)] animate-pulse'
                      : 'bg-[#7c3aed] border-[#9d6bff] hover:scale-105 hover:bg-[#6d28d9] shadow-lg'
                    }`}
                  title={isRecording ? 'Detener (enviar)' : 'Hablar con el tutor'}
                >
                  {isRecording
                    ? <div className="w-5 h-5 bg-white rounded-sm" />
                    : <Mic size={26} className="text-white" />}
                </button>

                {/* SEPARADOR */}
                <div className="w-px h-6 bg-white/10" />

                {/* Mute TTS */}
                <button
                  onClick={() => setTutorMuted(m => !m)}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-all"
                  title={tutorMuted ? 'Activar voz' : 'Silenciar tutor'}
                >
                  {tutorMuted
                    ? <VolumeX className="text-orange-400" size={18} />
                    : <Volume2 className="text-white" size={18} />}
                </button>

                {/* Camera toggle */}
                {!cameraError && (
                  <button
                    onClick={toggleCamera}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-all"
                    title={cameraOn ? 'Apagar cámara' : 'Encender cámara'}
                  >
                    {cameraOn
                      ? <Video className="text-white" size={18} />
                      : <VideoOff className="text-slate-400" size={18} />}
                  </button>
                )}

                {/* SEPARADOR */}
                <div className="w-px h-6 bg-white/10" />

                {/* End call */}
                <button
                  onClick={handleEndCall}
                  className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 border border-red-400 flex items-center justify-center shadow-lg transition-all"
                  title="Terminar sesión"
                >
                  <PhoneOff size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* RIGHT: Chat panel */}
            <Card className="flex-1 w-full lg:w-[460px] bg-[#1a1a2e] border-white/5 flex flex-col min-h-0 rounded-3xl lg:rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5">
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                <div>
                  <span className="text-white font-black uppercase text-xs tracking-[0.3em] mb-1 block">Chat con Tutor IA</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiLoading ? 'bg-yellow-400 animate-bounce' : 'bg-[#10b981] animate-pulse'}`} />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {aiLoading ? 'PROCESANDO' : 'EN VIVO • IA REAL'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5 text-sm font-mono text-[#0cf]">
                  {formatTime(callTime)}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-black/10">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Bot size={14} className="text-[#7c3aed]" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-[2rem] shadow-lg overflow-hidden ${m.role === 'user'
                        ? 'rounded-tr-sm'
                        : 'rounded-tl-sm'
                      }`}>
                      <div className={`p-5 text-[15px] leading-relaxed ${m.role === 'user'
                          ? 'bg-[#7c3aed] text-white'
                          : 'bg-white/5 text-slate-200 border border-white/5'
                        }`}>
                        {renderMessageText(m.text, m.role)}
                      </div>
                      {/* Show corrections and tips for AI messages */}
                      {m.role === 'assistant' && (m.corrections?.length > 0 || m.tips?.length > 0) && (
                        <div className="bg-black/30 border border-white/5 border-t-0 p-3 space-y-2">
                          {m.corrections?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">✏️ Correcciones</p>
                              {m.corrections.map((c, ci) => (
                                <p key={ci} className="text-[12px] text-orange-200/80 leading-[1.6]">
                                  • {renderMessageText(c, 'assistant')}
                                </p>
                              ))}
                            </div>
                          )}
                          {m.tips?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">💡 Tips</p>
                              {m.tips.map((t, ti) => (
                                <p key={ti} className="text-[12px] text-cyan-200/80 leading-[1.6]">
                                  • {renderMessageText(t, 'assistant')}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Interim speech transcript */}
                {isRecording && interimText && interimText !== '...' && (
                  <div className="flex justify-end">
                    <p className="text-[#0cf] text-sm font-bold italic animate-pulse opacity-70 max-w-[85%] text-right">
                      "{interimText}"
                    </p>
                  </div>
                )}

                {/* AI thinking indicator */}
                {aiLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start items-end gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-[#7c3aed]" />
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-[2rem] rounded-tl-sm flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Text input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputMessage.trim() && !aiLoading) {
                    processMessage(inputMessage.trim());
                    setInputMessage('');
                  }
                }}
                className="p-5 flex gap-3 bg-[#111126] border-t border-white/5 shrink-0"
              >
                <input
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  disabled={aiLoading}
                  className="flex-1 bg-white/[0.03] border-2 border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#7c3aed]/50 placeholder:text-slate-700 transition-all font-medium text-base disabled:opacity-50"
                  placeholder={aiLoading ? 'Tutor pensando...' : 'Escribe tu mensaje...'}
                />
                <Button
                  size="icon"
                  type="submit"
                  disabled={aiLoading || !inputMessage.trim()}
                  className="bg-[#7c3aed] rounded-2xl h-14 w-14 shrink-0 shadow-lg active:scale-95 hover:bg-[#6d28d9] disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={22} className="text-white animate-spin" /> : <Send size={22} className="text-white" />}
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoCall;
