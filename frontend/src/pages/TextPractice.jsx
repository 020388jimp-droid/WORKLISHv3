import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  FileText, 
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { updateProgress } from '../lib/utils';
import { practiceText } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

export const TextPractice = () => {
  const { isAuthenticated } = useAuth();
  const { t, feedbackLang } = useLanguage();
  const [text, setText] = useState('');
  const [context, setContext] = useState('professional email');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    return localStorage.getItem('isAudioEnabled') === 'true';
  });

  const contexts = [
    { value: 'professional email', label: t('text.contexts.email') },
    { value: 'business report', label: t('text.contexts.report') },
    { value: 'presentation script', label: t('text.contexts.presentation') },
    { value: 'meeting notes', label: t('text.contexts.meeting') },
    { value: 'job application', label: t('text.contexts.job') },
    { value: 'LinkedIn post', label: t('text.contexts.linkedin') }
  ];

  useEffect(() => {
    localStorage.setItem('isAudioEnabled', isAudioEnabled);
    if (!isAudioEnabled) window.speechSynthesis.cancel();
  }, [isAudioEnabled]);

  const speak = useCallback((textToSpeak) => {
    if (!isAudioEnabled) return;
    window.speechSynthesis.cancel();
    
    // Detectar si el texto es principalmente español
    const isMainlySpanish = (textToSpeak.match(/[áéíóúñ¿¡]/g) || []).length > 2;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = isMainlySpanish ? 'es-MX' : 'en-US';
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes(utterance.lang) && v.name.includes('Google')) || 
                           voices.find(v => v.lang.includes(utterance.lang));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [isAudioEnabled]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error(t('common.error'));
      return;
    }

    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para analizar texto.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await practiceText(text, context, feedbackLang);
      setResult(response);
      
      const avgScore = Math.round((response.grammar_score + response.vocabulary_score) / 2);
      updateProgress('text', avgScore);
      toast.success(t('common.success'));

      // Leer feedback si el audio está activado
      if (isAudioEnabled) {
        const feedbackToSpeak = `Tu puntaje es ${avgScore} por ciento. Aquí tienes unos consejos: ${response.tips.join('. ')}`;
        setTimeout(() => speak(feedbackToSpeak), 500);
      }
    } catch (error) {
      toast.error(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="pb-10">
      <Toaster position="top-center" richColors />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4 px-1">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black font-['Outfit'] text-white mb-2 leading-none">Práctica de Escritura</h1>
          <p className="text-slate-500 font-medium">Corección profesional y consejos de estilo.</p>
        </motion.div>

        {/* SELECTOR DE AUDIO PREMIUM (Sliding Toggle) */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 pr-4 rounded-2xl backdrop-blur-3xl self-start md:self-auto">
          <div 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${isAudioEnabled ? 'bg-[#7c3aed]' : 'bg-slate-700'}`}
          >
            <motion.div 
               animate={{ x: isAudioEnabled ? 28 : 4 }}
               transition={{ type: "spring", stiffness: 500, damping: 30 }}
               className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-lg flex items-center justify-center text-[#7c3aed]"
            >
              {isAudioEnabled ? <Volume2 size={12}/> : <VolumeX size={12} className="text-slate-400"/>}
            </motion.div>
          </div>
          <span className={`text-[11px] font-black uppercase tracking-widest ${isAudioEnabled ? 'text-[#7c3aed]' : 'text-slate-500'}`}>
            {isAudioEnabled ? 'Audio Activado' : 'Solo Lectura'}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="bg-[#1a1a2e] border-white/5 p-8 rounded-[2rem] shadow-2xl h-full flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-lg">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-none">Tu Borrador</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Escribe o pega tu texto aquí</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">Selecciona el Contexto</label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger className="bg-white/5 border-2 border-white/5 text-white h-14 rounded-2xl focus:border-[#7c3aed]/50 transition-all font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 rounded-2xl overflow-hidden">
                  {contexts.map((ctx) => (
                    <SelectItem key={ctx.value} value={ctx.value} className="text-white hover:bg-[#7c3aed] transition-colors focus:bg-[#7c3aed]">{ctx.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder={`Escribe tu ${contexts.find(c => c.value === context)?.label.toLowerCase() || 'texto'} aquí...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 min-h-[320px] bg-black/40 border-2 border-white/5 text-white placeholder:text-slate-700 rounded-3xl p-6 text-lg leading-relaxed focus:border-[#7c3aed]/50 resize-none mb-8 transition-all"
            />

            <div className="flex gap-4 mt-auto">
              <Button onClick={handleSubmit} disabled={loading || !text.trim()} className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white h-16 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95">
                {loading ? <Loader2 className="animate-spin text-white" size={24}/> : <><Send className="mr-2" size={20}/> Analizar Texto</>}
              </Button>
              <Button onClick={handleReset} variant="outline" className="border-2 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white h-16 w-16 rounded-2xl transition-all active:rotate-180 duration-500">
                <RefreshCw size={24}/>
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="bg-[#1a1a2e] border-white/5 p-8 rounded-[2.5rem] shadow-2xl h-full border border-white/5 relative overflow-hidden">
            {result ? (
              <div className="space-y-10 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/30 border border-white/5 rounded-3xl p-6 shadow-inner">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Gramática</p>
                    <div className="flex items-end gap-2">
                       <span className={`text-5xl font-black ${result.grammar_score >= 80 ? 'text-[#10b981]' : result.grammar_score >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{result.grammar_score}%</span>
                    </div>
                    <Progress value={result.grammar_score} className="h-2.5 mt-4 bg-white/5 rounded-full overflow-hidden" />
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-3xl p-6 shadow-inner">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Vocabulario</p>
                    <div className="flex items-end gap-2">
                       <span className={`text-5xl font-black ${result.vocabulary_score >= 80 ? 'text-[#10b981]' : result.vocabulary_score >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{result.vocabulary_score}%</span>
                    </div>
                    <Progress value={result.vocabulary_score} className="h-2.5 mt-4 bg-white/5 rounded-full overflow-hidden" />
                  </div>
                </div>

                <div>
                   <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 text-[#10b981]"><CheckCircle size={16}/> Texto Corregido</h3>
                   <div className="bg-[#10b981]/5 border border-[#10b981]/20 rounded-3xl p-6 text-slate-200 text-lg italic leading-relaxed font-medium shadow-inner">"{result.corrected_text}"</div>
                </div>

                <div>
                   <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 text-[#f59e0b]"><Lightbulb size={16}/> Consejos Pro</h3>
                   <div className="space-y-4">
                     {result.tips.map((tip, index) => (
                       <div key={index} className="flex items-start gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 group hover:bg-white/[0.05] transition-all">
                         <div className="w-8 h-8 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center text-xs font-black shrink-0 border border-[#7c3aed]/20">{index + 1}</div>
                         <p className="text-slate-400 text-sm font-medium leading-relaxed group-hover:text-slate-200 transition-colors">{tip}</p>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#7c3aed]/20 to-transparent flex items-center justify-center mb-8 relative">
                   <div className="absolute inset-0 bg-[#7c3aed]/5 blur-3xl animate-pulse rounded-full" />
                   <AlertCircle size={48} className="text-[#7c3aed]/40 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Esperando tu texto</h3>
                <p className="text-slate-600 max-w-sm font-medium">Redacta tu propuesta o mensaje y nuestro tutor Gemini te dará el feedback profesional en segundos.</p>
              </div>
            )}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#7c3aed]/5 blur-[100px] rounded-full" />
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TextPractice;
