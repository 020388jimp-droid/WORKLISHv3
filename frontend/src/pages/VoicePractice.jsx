import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { Sidebar } from '../components/Sidebar';
import { updateProgress } from '../lib/utils';
import { practiceVoice } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

export const VoicePractice = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expectedText, setExpectedText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const samplePhrases = [
    "I would like to schedule a meeting to discuss the project timeline.",
    "Thank you for your email. I will review the proposal and get back to you.",
    "Could you please clarify the requirements for this task?",
    "I believe we can achieve our goals by working together as a team.",
    "Let me walk you through the presentation slides."
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setResult(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Grabacion iniciada');
    } catch (error) {
      toast.error('No se pudo acceder al microfono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast.info('Grabacion detenida');
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      toast.error('Primero graba algo');
      return;
    }

    setLoading(true);

    try {
      const data = await practiceVoice(audioBlob, expectedText.trim() || null, 'business conversation');
      setResult(data);
      updateProgress('voice', data.accuracy_score);
      toast.success('Analisis completado!');
    } catch (error) {
      toast.error(error.message || 'Error al analizar el audio');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAudioBlob(null);
    setResult(null);
    setRecordingTime(0);
    setExpectedText('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Sidebar />
      <Toaster position="top-center" richColors />
      
      <main className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 
            data-testid="voice-practice-title"
            className="text-3xl font-bold font-['Outfit'] text-white mb-2"
          >
            Entrenamiento de Voz
          </h1>
          <p className="text-slate-400">
            Graba tu voz y recibe retroalimentacion sobre tu pronunciacion.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recording Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-[#1a1a2e] border-white/5 p-6">
              {/* Recording interface */}
              <div className="text-center mb-8">
                <motion.div 
                  className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-[#ef4444]/20 border-4 border-[#ef4444]' 
                      : audioBlob 
                        ? 'bg-[#10b981]/20 border-4 border-[#10b981]' 
                        : 'bg-[#06b6d4]/20 border-4 border-[#06b6d4]'
                  }`}
                  animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
                >
                  {isRecording ? (
                    <MicOff size={48} className="text-[#ef4444]" />
                  ) : audioBlob ? (
                    <CheckCircle size={48} className="text-[#10b981]" />
                  ) : (
                    <Mic size={48} className="text-[#06b6d4]" />
                  )}
                </motion.div>

                {isRecording && (
                  <div className="mb-4">
                    <span className="text-3xl font-mono text-[#ef4444]">
                      {formatTime(recordingTime)}
                    </span>
                    <div className="flex justify-center gap-1 mt-2 audio-wave">
                      {[1,2,3,4,5].map(i => (
                        <div 
                          key={i} 
                          className="w-1 h-6 bg-[#ef4444] rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <p className="text-[#10b981] mb-4">
                    Grabacion lista ({formatTime(recordingTime)})
                  </p>
                )}

                <div className="flex justify-center gap-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      data-testid="start-recording"
                      className="bg-[#06b6d4] hover:bg-[#22d3ee] text-white rounded-full px-8"
                    >
                      <Play className="mr-2" size={18} />
                      Iniciar Grabacion
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      data-testid="stop-recording"
                      className="bg-[#ef4444] hover:bg-[#f87171] text-white rounded-full px-8"
                    >
                      <Square className="mr-2" size={18} />
                      Detener
                    </Button>
                  )}
                  {audioBlob && !isRecording && (
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="border-white/10 text-slate-300 hover:bg-white/5 rounded-full"
                    >
                      <RotateCcw size={18} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Expected text */}
              <div className="mb-6">
                <label className="text-sm text-slate-400 mb-2 block">
                  Texto de referencia (opcional)
                </label>
                <Textarea
                  data-testid="expected-text"
                  placeholder="Escribe el texto que intentas pronunciar para comparar..."
                  value={expectedText}
                  onChange={(e) => setExpectedText(e.target.value)}
                  className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* Sample phrases */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Frases de ejemplo
                </label>
                <div className="space-y-2">
                  {samplePhrases.map((phrase, index) => (
                    <button
                      key={index}
                      onClick={() => setExpectedText(phrase)}
                      className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-slate-300 transition-colors"
                    >
                      "{phrase}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              {audioBlob && !isRecording && (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  data-testid="analyze-voice"
                  className="w-full mt-6 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Analizando pronunciacion...
                    </>
                  ) : (
                    'Analizar Pronunciacion'
                  )}
                </Button>
              )}
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#1a1a2e] border-white/5 p-6 h-full">
              {result ? (
                <>
                  {/* Score */}
                  <div className="mb-6">
                    <div className="bg-white/5 rounded-xl p-6 text-center">
                      <p className="text-slate-400 text-sm mb-2">Puntuacion de Pronunciacion</p>
                      <span className={`text-5xl font-bold ${
                        result.accuracy_score >= 80 ? 'text-[#10b981]' : 
                        result.accuracy_score >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                      }`}>
                        {result.accuracy_score}%
                      </span>
                      <Progress 
                        value={result.accuracy_score} 
                        className="h-3 bg-white/10 mt-4"
                      />
                    </div>
                  </div>

                  {/* Transcription */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={18} className="text-[#06b6d4]" />
                      <h3 className="font-semibold text-white">Lo que dijiste</h3>
                    </div>
                    <div 
                      data-testid="transcribed-text"
                      className="bg-[#06b6d4]/10 border border-[#06b6d4]/20 rounded-xl p-4 text-slate-200"
                    >
                      "{result.transcribed_text}"
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle size={18} className="text-[#f59e0b]" />
                      <h3 className="font-semibold text-white">Retroalimentacion</h3>
                    </div>
                    <p className="text-slate-300 bg-white/5 rounded-xl p-4">
                      {result.pronunciation_feedback}
                    </p>
                  </div>

                  {/* Tips */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={18} className="text-[#7c3aed]" />
                      <h3 className="font-semibold text-white">Consejos</h3>
                    </div>
                    <div className="space-y-2">
                      {result.tips.map((tip, index) => (
                        <div 
                          key={index}
                          data-testid={`voice-tip-${index}`}
                          className="flex items-start gap-3 bg-white/5 rounded-xl p-3"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#7c3aed]/20 text-[#7c3aed] flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-slate-300 text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mb-6">
                    <Mic size={40} className="text-[#06b6d4]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Listo para grabar
                  </h3>
                  <p className="text-slate-400 max-w-sm">
                    Presiona "Iniciar Grabacion" para comenzar. Habla claramente y luego analiza tu pronunciacion.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default VoicePractice;
