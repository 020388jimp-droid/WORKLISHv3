import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Loader2, Send, RefreshCw, Volume2, VolumeX,
  Lightbulb, Sparkles, Languages, CheckCircle2 
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { howToSay } from '../lib/firebase';
import { updateProgress } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import { safeSpeech, playProfessionalSpeech } from '../lib/speech';
import { showInterstitialAd } from '../lib/ads';

export const HowToSay = () => {
  const { userProfile, updateProfile } = useAuth();
  const { appLang, feedbackLang } = useLanguage();
  const isEn = appLang === 'en';

  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isPlayingRecommendation, setIsPlayingRecommendation] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => localStorage.getItem('isAudioEnabled') !== 'false');

  useEffect(() => {
    localStorage.setItem('isAudioEnabled', isAudioEnabled);
    if (!isAudioEnabled) safeSpeech.cancel();
  }, [isAudioEnabled]);

  const playRecommendationAudio = async (textToPlay) => {
    if (isPlayingRecommendation || !textToPlay) return;
    setIsPlayingRecommendation(true);
    try {
      await playProfessionalSpeech(textToPlay, userProfile?.preferred_voice || 'orion');
    } finally {
      setIsPlayingRecommendation(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return toast.error(isEn ? 'Please enter a phrase' : 'Por favor escribe una frase');

    setLoading(true);
    setResult(null);
    try {
      const response = await howToSay(text, context, feedbackLang);
      setResult(response);
      toast.success(isEn ? 'Perfect! Here is how you say it' : '¡Perfecto! Así es como se dice');
      updateProgress('howToSay', 100, userProfile, updateProfile);
      
      if (isAudioEnabled && response.recommendations) {
        playRecommendationAudio(response.recommendations);
      }
      
      // Mostrar anuncio si el usuario tiene plan gratuito (se retrasa para no cortar el audio)
      setTimeout(() => showInterstitialAd(userProfile), 3500);
    } catch (error) {
      toast.error(error.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (content) => {
    if (!content) return '';
    const parts = content.split(/(\([^)]+\))/);
    return parts.map((part, index) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        const word = part.slice(1, -1);
        return (
          <button
            key={index}
            onClick={() => playProfessionalSpeech(word, userProfile?.preferred_voice || 'orion')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 mx-1 rounded-xl font-bold bg-[#7c3aed]/15 text-[#c4a5ff] border-b-2 border-[#7c3aed]/30 transition-all active:scale-95 shadow-sm hover:translate-y-0.5 text-lg"
          >
            <Volume2 size={14} />
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
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 md:gap-6">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-tr from-[#7c3aed] to-[#ec4899] rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 ring-4 ring-white/5">
            <Languages className="text-white w-10 h-10 md:w-14 md:h-14" />
          </div>
          <div>
            <h1 className="text-3xl md:text-6xl font-black text-white leading-tight mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {isEn ? 'How to Say' : 'Cómo se dice'}
            </h1>
            <p className="text-slate-400 font-medium text-sm md:text-xl">
              {isEn ? 'Learn the best way to express your ideas.' : 'Aprende la mejor forma de expresar tus ideas.'}
            </p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 pr-5 rounded-2xl backdrop-blur-3xl shadow-xl ring-1 ring-white/5" id="premium-voice-toggle">
          <div onClick={() => setIsAudioEnabled(!isAudioEnabled)} className={`w-12 h-7 md:w-14 md:h-8 rounded-full relative cursor-pointer transition-all duration-500 ${isAudioEnabled ? 'bg-gradient-to-r from-[#7c3aed] to-[#ec4899]' : 'bg-slate-700'}`}>
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
        {/* Input Card */}
        <Card className="bg-[#1a1a2e]/60 border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col backdrop-blur-xl ring-1 ring-white/5">
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <Sparkles size={12} className="text-[#7c3aed]"/> {isEn ? 'What do you want to say?' : '¿Qué quieres decir?'}
              </label>
              <Textarea 
                id="how-to-say-text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={isEn ? "Type a phrase in your language..." : "Escribe una frase en español..."}
                className="w-full bg-black/40 border-2 border-white/5 rounded-[1.5rem] p-6 text-white text-xl focus:border-[#7c3aed]/50 min-h-[120px] resize-none leading-relaxed transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <MessageSquare size={12} className="text-[#ec4899]"/> {isEn ? 'Context (Optional)' : 'Contexto (Opcional)'}
              </label>
              <Textarea 
                id="how-to-say-context"
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder={isEn ? "e.g. In a business meeting, with a client..." : "ej. En una reunión de trabajo, con un cliente..."}
                className="w-full bg-black/40 border-2 border-white/5 rounded-[1.5rem] p-6 text-white text-lg focus:border-[#ec4899]/50 min-h-[100px] resize-none leading-relaxed transition-all font-medium"
              />
            </div>

            <div className="flex gap-4 mt-auto pt-6">
              <Button 
                id="how-to-say-submit"
                onClick={handleSubmit} 
                disabled={loading || !text.trim()} 
                className="flex-1 bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-white h-20 rounded-2xl font-black text-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={24}/> : <><Send className="mr-3" size={20}/> <span>{isEn ? 'Consult IA' : 'Consultar IA'}</span></>}
              </Button>
              <Button 
                onClick={() => { setText(''); setContext(''); setResult(null); }} 
                variant="outline" 
                className="border-2 border-white/10 text-slate-500 h-20 w-20 rounded-2xl hover:text-white bg-black/20"
              >
                <RefreshCw size={24} />
              </Button>
            </div>
          </div>
        </Card>

        {/* Result Card */}
        <Card className="bg-[#1a1a2e]/80 border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col h-full relative overflow-hidden backdrop-blur-2xl ring-1 ring-white/5 min-h-[400px]">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 relative z-10"
            >
              <div>
                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-4 flex items-center gap-2 text-[#7c3aed]">
                  <CheckCircle2 size={12}/> {isEn ? 'Natural Expression' : 'Expresión Natural'}
                </h3>
                <div className="bg-[#7c3aed]/5 border border-[#7c3aed]/20 rounded-3xl p-8 md:p-10 text-slate-200 text-2xl italic leading-relaxed font-semibold shadow-2xl">
                  {renderMessageText(result.phrase)}
                </div>
              </div>

              {result.examples && result.examples.length > 0 && (
                <div>
                  <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-4 flex items-center gap-2 text-[#10b981]">
                    <Sparkles size={12}/> {isEn ? 'Usage Examples' : 'Ejemplos de Uso'}
                  </h3>
                  <div className="space-y-4">
                    {result.examples.map((ex, i) => (
                      <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-slate-300 text-lg leading-relaxed">
                        {renderMessageText(ex)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 text-[#f59e0b]">
                      <Lightbulb size={16}/> {isEn ? 'Tutor Recommendations' : 'Recomendaciones del Tutor'}
                    </h3>
                    <Button 
                      onClick={() => playRecommendationAudio(result.recommendations)} 
                      disabled={isPlayingRecommendation} 
                      variant="ghost" 
                      size="sm" 
                      className={`px-4 h-8 border transition-all w-fit ${isPlayingRecommendation ? 'text-slate-600 border-white/5 cursor-not-allowed' : 'text-slate-400 hover:text-white border-white/5'}`}
                    >
                      <Volume2 size={14} className={`mr-2 ${isPlayingRecommendation ? 'animate-pulse' : ''}`}/> 
                      {isPlayingRecommendation ? (isEn ? 'Playing...' : 'Reproduciendo...') : (isEn ? 'Hear all' : 'Oír todo')}
                    </Button>
                  </div>
                  <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/10 rounded-2xl p-6 text-slate-400 text-lg leading-relaxed italic">
                    {renderMessageText(result.recommendations)}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 relative z-10 text-center">
              <Languages size={64} className="text-slate-800 mb-6" />
              <h3 className="text-3xl font-black text-white mb-4">
                {isEn ? 'Ready to Translate' : 'Listo para traducir'}
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto font-semibold text-lg leading-relaxed">
                {isEn ? 'Enter a phrase to learn its professional equivalent in English.' : 'Escribe una frase para conocer su equivalente profesional en inglés.'}
              </p>
            </div>
          )}
          
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#7c3aed]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#ec4899]/5 blur-[120px] rounded-full pointer-events-none" />
        </Card>
      </div>
    </div>
  );
};

export default HowToSay;
