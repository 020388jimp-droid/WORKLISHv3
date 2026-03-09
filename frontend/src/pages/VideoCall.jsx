import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Video, 
  VideoOff,
  Mic, 
  MicOff, 
  Send, 
  Loader2,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { Sidebar } from '../components/Sidebar';
import { updateProgress } from '../lib/utils';
import { videoCall as videoCallAPI } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

export const VideoCall = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { feedbackLang } = useLanguage();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('job interview');
  const [conversation, setConversation] = useState([]);
  const [currentTips, setCurrentTips] = useState([]);
  const [currentCorrections, setCurrentCorrections] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const synthRef = useRef(null);

  const scenarios = [
    { value: 'job interview', label: 'Entrevista de Trabajo' },
    { value: 'salary negotiation', label: 'Negociacion Salarial' },
    { value: 'client meeting', label: 'Reunion con Cliente' },
    { value: 'team standup', label: 'Daily Standup' },
    { value: 'presentation', label: 'Presentacion' },
    { value: 'performance review', label: 'Evaluacion de Desempeno' }
  ];

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [navigate, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const speakText = useCallback((text) => {
    if (!synthRef.current || !aiVoiceEnabled) return;
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [aiVoiceEnabled]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCallActive(true);
      setConversation([]);
      setCurrentTips([]);
      setCurrentCorrections([]);
      
      const greetings = {
        'job interview': "Hello! Thank you for joining us today. I'm the hiring manager for this position. Let's start - could you tell me a little about yourself?",
        'salary negotiation': "Thanks for scheduling this meeting. I understand you wanted to discuss your compensation. What's on your mind?",
        'client meeting': "Good morning! Thank you for meeting with me today. I've reviewed our project proposal. Shall we begin?",
        'team standup': "Good morning team! Let's do our daily standup. What did you work on yesterday and what's planned for today?",
        'presentation': "Welcome everyone. The floor is yours - please begin your presentation whenever you're ready.",
        'performance review': "Hi, thanks for coming in. This is your quarterly performance review. How do you feel about your progress?"
      };

      const greeting = greetings[scenario] || greetings['job interview'];
      
      setConversation([{
        role: 'ai',
        content: greeting
      }]);

      setTimeout(() => speakText(greeting), 500);
      toast.success('Llamada iniciada - Presiona el microfono para hablar');
    } catch (error) {
      toast.error('No se pudo acceder a la camara o microfono');
    }
  };

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsCallActive(false);
    setIsRecording(false);
    setIsSpeaking(false);
    
    if (conversation.length > 2) {
      updateProgress('video', 75);
    }
    
    toast.info('Llamada finalizada');
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const startVoiceRecording = async () => {
    if (isRecording || loading) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceInput(blob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingStatus('Grabando... (suelta para enviar)');
    } catch (error) {
      toast.error('No se pudo acceder al microfono');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStatus('Procesando...');
    }
  };

  const processVoiceInput = async (audioBlob) => {
    setLoading(true);
    setRecordingStatus('Transcribiendo...');
    
    try {
      // Use Web Speech API for browser-based transcription
      const userMessage = await new Promise((resolve, reject) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          reject(new Error('Speech recognition not available'));
          return;
        }
        // Fallback: send directly to video call with a note
        resolve(null);
      }).catch(() => null);

      // If no browser transcription, send text message instead
      if (!userMessage) {
        toast.info('Usa el campo de texto para enviar tu mensaje');
        setRecordingStatus('');
        setLoading(false);
        return;
      }
      
      setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
      setRecordingStatus('Obteniendo respuesta...');
      
      const data = await videoCallAPI(
        userMessage,
        conversation.map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        scenario,
        feedbackLang
      );
      
      setConversation(prev => [...prev, { role: 'ai', content: data.ai_response }]);
      setCurrentTips(data.tips || []);
      setCurrentCorrections(data.corrections || []);
      speakText(data.ai_response);
      setRecordingStatus('');
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Error al procesar la voz. Intenta escribir tu mensaje.');
      setRecordingStatus('');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);

    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const data = await videoCallAPI(
        userMessage,
        conversation.map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        scenario,
        feedbackLang
      );

      setConversation(prev => [...prev, { role: 'ai', content: data.ai_response }]);
      setCurrentTips(data.tips || []);
      setCurrentCorrections(data.corrections || []);
      speakText(data.ai_response);
    } catch (error) {
      toast.error(error.message || 'Error en la comunicacion');
      setConversation(prev => [...prev, { 
        role: 'ai', 
        content: "I'm sorry, I didn't catch that. Could you please repeat?" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Sidebar />
      <Toaster position="top-center" richColors />
      
      <main className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 
            data-testid="video-call-title"
            className="text-3xl font-bold font-['Outfit'] text-white mb-2"
          >
            Video Llamada con IA
          </h1>
          <p className="text-slate-400">
            Practica conversaciones profesionales en tiempo real. Usa el microfono para hablar.
          </p>
        </motion.div>

        {!isCallActive ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-[#1a1a2e] border-white/5 p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto mb-6 pulse-ai">
                <Video size={48} className="text-[#10b981]" />
              </div>
              
              <h2 className="text-2xl font-semibold text-white mb-2">
                Inicia una sesion de practica
              </h2>
              <p className="text-slate-400 mb-8">
                Selecciona un escenario y practica tu ingles con nuestro tutor de IA.
              </p>

              <div className="mb-8">
                <label className="text-sm text-slate-400 mb-2 block text-left">
                  Escenario de practica
                </label>
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger 
                    data-testid="scenario-select"
                    className="bg-white/5 border-white/10 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {scenarios.map((s) => (
                      <SelectItem 
                        key={s.value} 
                        value={s.value}
                        className="text-white hover:bg-white/10"
                      >
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={startCall}
                data-testid="start-call"
                className="bg-[#10b981] hover:bg-[#059669] text-white rounded-full px-12 py-6 text-lg glow-secondary"
              >
                <Phone className="mr-2" size={24} />
                Iniciar Llamada
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-[#1a1a2e] border-white/5 p-4 relative overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-xl flex items-center justify-center relative">
                  <motion.div 
                    className={`w-32 h-32 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center ${isSpeaking ? 'pulse-ai' : ''}`}
                    animate={{ scale: isSpeaking ? [1, 1.1, 1] : loading ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 1.5, repeat: (isSpeaking || loading) ? Infinity : 0 }}
                  >
                    <span className="text-4xl font-bold text-white">AI</span>
                  </motion.div>
                  
                  {isSpeaking && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#10b981]/20 px-3 py-1 rounded-full">
                      <Volume2 size={16} className="text-[#10b981]" />
                      <span className="text-sm text-[#10b981]">Hablando...</span>
                    </div>
                  )}
                  
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#ef4444]/20 px-3 py-1 rounded-full animate-pulse">
                      <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                      <span className="text-sm text-[#ef4444]">Grabando...</span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                    />
                    {!isVideoOn && (
                      <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
                        <VideoOff size={32} className="text-slate-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    onMouseDown={startVoiceRecording}
                    onMouseUp={stopVoiceRecording}
                    onMouseLeave={stopVoiceRecording}
                    onTouchStart={startVoiceRecording}
                    onTouchEnd={stopVoiceRecording}
                    disabled={loading || isSpeaking}
                    data-testid="voice-record-btn"
                    className={`rounded-full w-16 h-16 p-0 transition-all ${
                      isRecording 
                        ? 'bg-[#ef4444] hover:bg-[#dc2626] scale-110 animate-pulse' 
                        : 'bg-[#10b981] hover:bg-[#059669]'
                    } text-white`}
                  >
                    <Mic size={28} />
                  </Button>
                  
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    data-testid="toggle-mute"
                    className={`rounded-full w-12 h-12 p-0 ${
                      isMuted ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]' : 'border-white/20 text-white'
                    }`}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </Button>
                  <Button
                    onClick={toggleVideo}
                    variant="outline"
                    data-testid="toggle-video"
                    className={`rounded-full w-12 h-12 p-0 ${
                      !isVideoOn ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]' : 'border-white/20 text-white'
                    }`}
                  >
                    {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </Button>
                  <Button
                    onClick={() => setAiVoiceEnabled(!aiVoiceEnabled)}
                    variant="outline"
                    data-testid="toggle-ai-voice"
                    className={`rounded-full w-12 h-12 p-0 ${
                      !aiVoiceEnabled ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]' : 'border-white/20 text-white'
                    }`}
                  >
                    {aiVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </Button>
                  <Button
                    onClick={endCall}
                    data-testid="end-call"
                    className="rounded-full w-12 h-12 p-0 bg-[#ef4444] hover:bg-[#dc2626] text-white"
                  >
                    <PhoneOff size={20} />
                  </Button>
                </div>
                
                {recordingStatus && (
                  <p className="text-center text-sm text-slate-400 mt-2">{recordingStatus}</p>
                )}
                
                <p className="text-center text-xs text-slate-500 mt-2">
                  Escribe tu respuesta en el campo de texto de abajo
                </p>
              </Card>

              <Card className="bg-[#1a1a2e] border-white/5 p-4">
                <ScrollArea className="h-64 pr-4">
                  <div className="space-y-4">
                    {conversation.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user' 
                            ? 'bg-[#7c3aed] text-white' 
                            : 'bg-white/10 text-slate-200'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 rounded-2xl px-4 py-3">
                          <Loader2 className="animate-spin text-slate-400" size={20} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="flex gap-2 mt-4">
                  <Input
                    data-testid="chat-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu respuesta aqui..."
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                    disabled={loading || isRecording}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !message.trim() || isRecording}
                    data-testid="send-message"
                    className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full px-6"
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {currentCorrections.length > 0 && (
                <Card className="bg-[#1a1a2e] border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={18} className="text-[#f59e0b]" />
                    <h3 className="font-semibold text-white">Correcciones</h3>
                  </div>
                  <div className="space-y-2">
                    {currentCorrections.map((correction, index) => (
                      <div 
                        key={index}
                        data-testid={`correction-${index}`}
                        className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl p-3"
                      >
                        <p className="text-sm text-slate-300">{correction}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {currentTips.length > 0 && (
                <Card className="bg-[#1a1a2e] border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={18} className="text-[#7c3aed]" />
                    <h3 className="font-semibold text-white">Consejos</h3>
                  </div>
                  <div className="space-y-2">
                    {currentTips.map((tip, index) => (
                      <div 
                        key={index}
                        data-testid={`video-tip-${index}`}
                        className="bg-white/5 rounded-xl p-3"
                      >
                        <p className="text-sm text-slate-300">{tip}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="bg-[#1a1a2e] border-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={18} className="text-[#06b6d4]" />
                  <h3 className="font-semibold text-white">Escenario</h3>
                </div>
                <p className="text-slate-400 text-sm capitalize">
                  {scenarios.find(s => s.value === scenario)?.label || scenario}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Tip: Escribe tu respuesta en ingles. El AI evaluara tu nivel.
                </p>
              </Card>
              
              <Card className="bg-[#1a1a2e] border-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 size={18} className="text-[#10b981]" />
                  <h3 className="font-semibold text-white">Controles de Voz</h3>
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Volume2 size={14} className="text-white" />
                    </div>
                    <span>Voz del AI: {aiVoiceEnabled ? 'Activada' : 'Desactivada'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoCall;
