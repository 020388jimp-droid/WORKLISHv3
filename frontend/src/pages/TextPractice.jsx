import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Send, Loader2, CheckCircle, AlertCircle, Lightbulb, FileText, 
  RefreshCw, Volume2, VolumeX, Sparkles 
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { updateProgress, canPractice, getTrialDaysLeft } from '../lib/utils';
import { practiceText, generateSpeech } from '../lib/firebase';
import { showInterstitialAd } from '../lib/ads';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import { safeSpeech, playProfessionalSpeech } from '../lib/speech';

export const TextPractice = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userProfile, updateProfile } = useAuth();
  const { t, feedbackLang } = useLanguage();
  const WRITING_TOPICS = [
    { en: "Email to request a vacation period", es: "Correo electrónico para solicitar un periodo de vacaciones" },
    { en: "Project status update report for the team", es: "Reporte de actualización del estado del proyecto para el equipo" },
    { en: "LinkedIn post about a new professional certification", es: "Publicación en LinkedIn sobre una nueva certificación profesional" },
    { en: "Meeting minutes summary from today's standup", es: "Resumen de la minuta de la reunión de seguimiento de hoy" },
    { en: "Formal job application letter for a senior role", es: "Carta formal de solicitud de empleo para un puesto senior" },
    { en: "Performance review self-evaluation for the quarter", es: "Autoevaluación de desempeño para el trimestre" },
    { en: "Client proposal for a new software project", es: "Propuesta para el cliente sobre un nuevo proyecto de software" },
    { en: "Technical documentation for a new API feature", es: "Documentación técnica para una nueva función de la API" },
    { en: "Professional response to a customer complaint", es: "Respuesta profesional a una queja de un cliente" },
    { en: "Announcement of a new company policy", es: "Anuncio de una nueva política de la empresa" }
  ];

  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => localStorage.getItem('isAudioEnabled') === 'true');
  const [isPlayingFeedback, setIsPlayingFeedback] = useState(false);

  useEffect(() => {
    const randomTopic = WRITING_TOPICS[Math.floor(Math.random() * WRITING_TOPICS.length)];
    setContext(userProfile?.language_level === 'beginner' ? `${randomTopic.en} (${randomTopic.es})` : randomTopic.en);
  }, [userProfile?.language_level]);

  useEffect(() => {
    localStorage.setItem('isAudioEnabled', isAudioEnabled);
    if (!isAudioEnabled) safeSpeech.cancel();
  }, [isAudioEnabled]);

  useEffect(() => {
    const daysLeft = getTrialDaysLeft(userProfile);
    if (daysLeft !== null) {
      toast.info(`Te quedan ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} de tu prueba gratuita. ¡Aprovéchalos!`, {
        icon: '🎁',
        duration: 5000
      });
    }
  }, [userProfile]);

  const playWriterAudio = async (textToPlay) => {
    if (!isAudioEnabled) return;
    if (isPlayingFeedback) return; // Prevent overlapping audio
    if (!textToPlay) return;
    setIsPlayingFeedback(true);
    try {
      await playProfessionalSpeech(textToPlay, userProfile?.preferred_voice || 'orion');
      setIsPlayingFeedback(false);
    } catch (err) {
      setIsPlayingFeedback(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return toast.error(t('common.error'));
    if (!isAuthenticated) return toast.error('Debes iniciar sesión.');

    if (!canPractice('text', userProfile)) {
      toast.error(t('common.limit_reached') || 'Has alcanzado el límite diario para tu plan.');
      navigate('/pricing');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await practiceText(text, context, feedbackLang);
      const cleanTips = response.tips.map(tip => tip.replace(/^"|"$/g, '').trim());
      const cleanResponse = { ...response, tips: cleanTips };
      setResult(cleanResponse);
      updateProgress('text', Math.round((response.grammar_score + response.vocabulary_score) / 2), userProfile, updateProfile);
      toast.success(t('common.success'));
      if (isAudioEnabled) {
        const feedbackText = feedbackLang === 'en' 
          ? `Result: Grammar ${Math.round(response.grammar_score)} percent, Vocabulary ${Math.round(response.vocabulary_score)} percent. Tips: ${cleanTips.join('. ')}`
          : `Resultado: Gramática ${Math.round(response.grammar_score)} por ciento, Vocabulario ${Math.round(response.vocabulary_score)} por ciento. Consejos: ${cleanTips.join('. ')}`;
        playWriterAudio(feedbackText);
      }
      
      // Mostrar anuncio si el usuario tiene plan gratuito (se retrasa para no cortar el audio)
      setTimeout(() => showInterstitialAd(userProfile), 3500);
      
    } catch (error) {
      toast.error(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (content, type = 'feedback') => {
    if (!content) return '';

    const parts = content.split(/(\([^)]+\))/);
    return parts.map((part, index) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        const word = part.slice(1, -1);
        return (
          <button
            key={index}
            onClick={() => playProfessionalSpeech(word, userProfile?.preferred_voice || 'orion')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 mx-1 rounded-xl font-bold transition-all active:scale-95 shadow-sm border-b-2 hover:border-b-0 hover:translate-y-0.5 ${
              type === 'corrected' 
                ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 text-lg md:text-xl' 
                : 'bg-[#7c3aed]/15 text-[#c4a5ff] border-[#7c3aed]/30 text-sm md:text-lg'
            }`}
          >
            <Volume2 size={type === 'corrected' ? 14 : 12} />
            {word}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="pb-10 px-0 md:px-4">
      <Toaster position="top-center" richColors />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 md:gap-6">
           <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 ring-4 ring-white/5">
             <FileText className="text-white w-10 h-10 md:w-14 md:h-14" />
           </div>
           <div>
             <h1 className="text-3xl md:text-6xl font-black text-white leading-tight mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Escritura</h1>
             <p className="text-slate-400 font-medium text-sm md:text-xl">Corrección profesional con IA.</p>
           </div>
        </motion.div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 pr-5 rounded-2xl backdrop-blur-3xl shadow-xl ring-1 ring-white/5" id="premium-voice-toggle">
          <div onClick={() => setIsAudioEnabled(!isAudioEnabled)} className={`w-12 h-7 md:w-14 md:h-8 rounded-full relative cursor-pointer transition-all duration-500 ${isAudioEnabled ? 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea]' : 'bg-slate-700'}`}>
            <motion.div animate={{ x: isAudioEnabled ? 28 : 4 }} className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-full absolute top-1 shadow-lg flex items-center justify-center text-[#7c3aed]">
              {isAudioEnabled ? <Volume2 size={10} strokeWidth={3}/> : <VolumeX size={10} strokeWidth={3} className="text-slate-400"/>}
            </motion.div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white underline decoration-[#7c3aed] decoration-2 underline-offset-4">
            {isAudioEnabled ? 'Premium Voice' : 'Solo Lectura'}
          </span>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-[#1a1a2e]/60 border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col backdrop-blur-xl ring-1 ring-white/5">
          <div className="space-y-4 mb-6" id="practice-scenarios">
            <div className="flex items-center justify-between px-2 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2">
                <Sparkles size={12} className="text-[#7c3aed]"/> Escenario de Práctica
              </span>
              <button
                onClick={() => {
                  const randomTopic = WRITING_TOPICS[Math.floor(Math.random() * WRITING_TOPICS.length)];
                  setContext(userProfile?.language_level === 'beginner' ? `${randomTopic.en} (${randomTopic.es})` : randomTopic.en);
                }}
                className="flex items-center gap-1 hover:text-[#7c3aed] transition-colors font-black cursor-pointer"
              >
                <RefreshCw size={12} /> Cambiar
              </button>
            </div>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              className="w-full bg-black/40 border-2 border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 text-white text-lg md:text-xl focus:outline-none focus:border-[#7c3aed]/50 min-h-[100px] md:min-h-[120px] resize-none leading-relaxed transition-all shadow-inner font-medium placeholder:text-slate-800"
              placeholder="Escribe o edita el tema de práctica..."
            />
          </div>

          <div className="relative group flex-1 flex flex-col">
            <div className="absolute left-6 top-6 text-slate-500 group-focus-within:text-[#7c3aed] transition-colors pointer-events-none opacity-20 group-focus-within:opacity-100 z-10">
              <FileText size={24} />
            </div>
            <Textarea 
              placeholder="Redacta aquí tu mensaje, reporte o post..." 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              className="flex-1 min-h-[250px] md:min-h-[350px] bg-black/40 border-2 border-white/5 text-white rounded-[2rem] p-8 md:pl-20 text-xl leading-relaxed focus:border-[#7c3aed]/50 resize-none transition-all font-medium placeholder:text-slate-800" 
            />
          </div>

          <div className="flex gap-4 mt-8">
            <Button onClick={handleSubmit} disabled={loading || !text.trim()} className="flex-1 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white h-20 rounded-2xl font-black text-2xl shadow-xl transition-all active:scale-[0.98]">
              {loading ? <Loader2 className="animate-spin" size={24}/> : <><Send className="mr-3" size={20}/> <span>Analizar</span></>}
            </Button>
            <Button onClick={() => {
              setText(''); 
              setResult(null); 
              const randomTopic = WRITING_TOPICS[Math.floor(Math.random() * WRITING_TOPICS.length)];
              setContext(userProfile?.language_level === 'beginner' ? `${randomTopic.en} (${randomTopic.es})` : randomTopic.en);
            }} variant="outline" className="border-2 border-white/10 text-slate-500 h-20 w-20 rounded-2xl hover:text-white bg-black/20">
              <RefreshCw size={24} />
            </Button>
          </div>
        </Card>
        <Card className="bg-[#1a1a2e]/80 border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col h-full relative overflow-hidden backdrop-blur-2xl ring-1 ring-white/5">
          {result ? (
            <div className="space-y-10 relative z-10 flex flex-col h-full">
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-black/40 border border-white/5 rounded-3xl p-8 shadow-inner"><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-[#10b981]">Gramática</p><div className="text-6xl font-black text-white tracking-tighter">{Math.round(result.grammar_score)}%</div><Progress value={Math.round(result.grammar_score)} className="h-2 mt-6" /></div>
                <div className="bg-black/40 border border-white/5 rounded-3xl p-8 shadow-inner"><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-[#7c3aed]">Vocabulario</p><div className="text-6xl font-black text-white tracking-tighter">{Math.round(result.vocabulary_score)}%</div><Progress value={Math.round(result.vocabulary_score)} className="h-2 mt-6" /></div>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-4 flex items-center gap-2 text-[#10b981]"><CheckCircle size={12}/> Texto Corregido</h3>
                <div className="bg-[#10b981]/5 border border-[#10b981]/20 rounded-3xl p-10 text-slate-200 text-2xl italic leading-relaxed font-semibold shadow-2xl relative"><span className="absolute -top-1 -left-1 text-8xl text-[#10b981]/10 font-serif">"</span>{renderMessageText(result.corrected_text, 'corrected')}<span className="absolute -bottom-6 -right-1 text-8xl text-[#10b981]/10 font-serif rotate-180">"</span></div>
              </div>
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4"><h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 text-[#f59e0b]"><Lightbulb size={16}/> Consejos</h3><Button onClick={() => playWriterAudio(result.tips.join('. '))} disabled={isPlayingFeedback} variant="ghost" size="sm" className={`px-4 h-8 border transition-all ${isPlayingFeedback ? 'text-slate-600 border-white/5 cursor-not-allowed' : 'text-slate-400 hover:text-white border-white/5'}`}><Volume2 size={14} className={`mr-2 ${isPlayingFeedback ? 'animate-pulse' : ''}`}/> {isPlayingFeedback ? 'Reproduciendo...' : 'Oír todo'}</Button></div>
                <div className="space-y-4">
                  {result.tips.map((tip, i) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="flex items-start gap-4 bg-white/[0.03] border border-white/5 rounded-[1.5rem] p-5 group hover:bg-white/[0.06] transition-all"><div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 text-[#c4a5ff] flex items-center justify-center text-xs font-black shrink-0 border border-[#7c3aed]/30">{i + 1}</div><p className="text-slate-400 text-lg font-semibold leading-relaxed group-hover:text-white transition-colors">{renderMessageText(tip, 'feedback')}</p></motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 relative z-10"><h3 className="text-4xl font-black text-white mb-4">Listo para corregir</h3><p className="text-slate-500 max-w-sm mx-auto font-semibold text-lg text-center leading-relaxed">Analizaremos tu gramática y estilo profesional al instante.</p></div>
          )}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#7c3aed]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#06b6d4]/5 blur-[120px] rounded-full pointer-events-none" />
        </Card>
      </div>
    </div>
  );
};
export default TextPractice;
