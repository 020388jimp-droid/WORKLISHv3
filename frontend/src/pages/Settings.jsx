import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Crown, 
  Calendar,
  Shield,
  Trash2,
  Download,
  Globe,
  BookOpen,
  Volume2,
  Sparkles
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LevelSelector } from '../components/LevelSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { getProgress } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, LANGUAGE_LEVELS } from '../contexts/LanguageContext';
import { Toaster, toast } from 'sonner';

export const Settings = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfile, logout, isAuthenticated } = useAuth();
  const progress = getProgress();
  const { t, level, setLevel, currentLevel, appLang } = useLanguage();
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const isEn = appLang === 'en';

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleExportProgress = () => {
    const data = JSON.stringify(progress, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'worklish_progress.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.success'));
  };

  const handleClearProgress = () => {
    if (window.confirm('Estas seguro de que quieres borrar todo tu progreso local?')) {
      localStorage.removeItem('worklish_progress');
      toast.success(t('common.success'));
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Estas seguro? Esta accion no se puede deshacer.')) {
      try {
        await logout();
        localStorage.removeItem('worklish_progress');
        localStorage.removeItem('worklish_language_level');
        toast.success(t('common.success'));
        navigate('/');
       } catch (error) {
        toast.error('Error al eliminar la cuenta');
      }
    }
  };

  const handleLevelChange = async (newLevel) => {
    try {
      await updateProfile({ language_level: newLevel });
      setLevel(newLevel);
      setShowLevelDialog(false);
      toast.success('Nivel actualizado');
    } catch (err) {
      toast.error('Error al actualizar nivel');
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 
          data-testid="settings-title"
          className="text-3xl font-bold font-['Outfit'] text-white mb-2"
        >
          {t('settings.title')}
        </h1>
        <p className="text-slate-400">
          {t('settings.subtitle')}
        </p>
      </motion.div>

      <div className="max-w-3xl space-y-6">
        {/* Language Level */}
        <Card className="bg-[#1a1a2e] border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Globe size={20} className="text-[#06b6d4]" />
            {t('settings.languageLevel')}
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                level === 'beginner' ? 'bg-[#10b981]/20' :
                level === 'intermediate' ? 'bg-[#f59e0b]/20' : 'bg-[#7c3aed]/20'
              }`}>
                <BookOpen size={24} className={`${
                  level === 'beginner' ? 'text-[#10b981]' :
                  level === 'intermediate' ? 'text-[#f59e0b]' : 'text-[#7c3aed]'
                }`} />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t('settings.currentLevel')}: {currentLevel?.name?.[appLang] || 'Principiante'}
                </p>
                <p className="text-slate-400 text-sm">
                  {currentLevel?.description?.[appLang] || t('settings.languageDesc')}
                </p>
              </div>
            </div>
            
            <Dialog open={showLevelDialog} onOpenChange={setShowLevelDialog}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="change-level-btn"
                  className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full ml-auto md:ml-0"
                >
                  {t('settings.changeLevel')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">{t('settings.changeLevel')}</DialogTitle>
                </DialogHeader>
                <LevelSelector 
                  currentLevel={level} 
                  onSelect={handleLevelChange}
                  showTitle={false}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.values(LANGUAGE_LEVELS).map((lvl) => (
              <div 
                key={lvl.id}
                className={`p-3 rounded-xl text-center transition-all ${
                  level === lvl.id 
                    ? 'bg-[#7c3aed]/20 border border-[#7c3aed]/50' 
                    : 'bg-white/5'
                }`}
              >
                <p className="text-sm font-medium text-white mb-1">{lvl.name?.[appLang]}</p>
                <p className="text-xs text-slate-400">
                  App: {lvl.appLanguage === 'es' ? 'ES' : 'EN'}
                  {' / '}
                  Feedback: {lvl.feedbackLanguage === 'es' ? 'ES' : 'EN'}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Tutor AI Voice Select */}
        <Card className="bg-[#1a1a2e] border-white/5 p-6 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c3aed]/10 blur-3xl rounded-full -z-10" />
          
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Volume2 size={22} className="text-[#7c3aed]" />
            {isEn ? 'AI Tutor Voice (Gemini Professional)' : 'Voz del Tutor IA (Gemini Professional)'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'orion', name: 'Orion', desc: isEn ? 'Cheerful • Deeper voice' : 'Alegre • Voz más grave', color: 'bg-blue-500/20 text-blue-400' },
              { id: 'pegasus', name: 'Pegasus', desc: isEn ? 'Calm • Deeper voice' : 'Calma • Voz más grave', color: 'bg-emerald-500/20 text-emerald-400' },
              { id: 'ursa', name: 'Ursa', desc: isEn ? 'Engaged • Mid pitch' : 'Comprometida • Tono medio', color: 'bg-purple-500/20 text-purple-400' },
              { id: 'nova', name: 'Nova', desc: isEn ? 'Subtle • Mid pitch' : 'Sutil • Tono medio', color: 'bg-orange-500/20 text-orange-400' },
              { id: 'eclipse', name: 'Eclipse', desc: isEn ? 'Energetic • Mid pitch' : 'Energética • Tono medio', color: 'bg-[#06b6d4]/20 text-[#06b6d4]' }
            ].map((voice) => (
              <motion.div
                key={voice.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    await updateProfile({ preferred_voice: voice.id });
                    toast.success(`Voz ${voice.name} seleccionada`);
                  } catch (err) {
                    toast.error('Error al guardar preferencia');
                  }
                }}
                className={`flex flex-col p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                  (userProfile?.preferred_voice || 'orion') === voice.id 
                    ? 'border-[#7c3aed] bg-[#7c3aed]/10 shadow-[0_0_20px_rgba(124,58,237,0.2)]' 
                    : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-white text-lg tracking-tight">{voice.name}</span>
                  {(userProfile?.preferred_voice || 'orion') === voice.id && (
                    <Sparkles size={16} className="text-[#06b6d4] animate-pulse" />
                  )}
                </div>
                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full self-start mb-1 ${voice.color}`}>
                  {voice.desc.split(' • ')[0]}
                </span>
                <p className="text-slate-500 text-xs font-medium">{voice.desc.split(' • ')[1]}</p>
              </motion.div>
            ))}
          </div>
          
          <p className="mt-6 text-[11px] text-slate-500 font-medium italic border-t border-white/5 pt-4">
            {isEn ? '* These voices use Google Cloud Studio technology to provide clear, natural bilingual (English/Spanish) pronunciation.' : '* Estas voces utilizan la tecnología de Google Cloud Studio para ofrecer una pronunciación bilingüe (Español/Inglés) natural.'}
          </p>
        </Card>

        {/* Profile */}
        <Card className="bg-[#1a1a2e] border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <User size={20} className="text-[#7c3aed]" />
            {t('settings.profile')}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-xl font-semibold text-white truncate">{userProfile?.name || 'Usuario'}</p>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail size={14} className="flex-shrink-0" />
                  <span className="text-sm truncate">{userProfile?.email || 'email@example.com'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription */}
        <Card className="bg-[#1a1a2e] border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Crown size={20} className="text-[#f59e0b]" />
            {t('settings.subscription')}
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl flex-wrap gap-4">
            <div>
              <p className="text-white font-medium capitalize">
                {t('settings.plan')} {userProfile?.subscription_status || 'Trial'}
              </p>
              {userProfile?.subscription_end && (
                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                  <Calendar size={14} />
                  <span>
                    {t('settings.expires')}: {new Date(userProfile.subscription_end).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>
            <Link 
              to="/pricing"
              className="inline-flex items-center justify-center px-6 h-10 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full ml-auto md:ml-0 font-medium transition-colors"
            >
              <Crown size={16} className="mr-2" />
              {t('settings.upgrade')}
            </Link>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="bg-[#1a1a2e] border-white/5 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
             <Shield size={20} className="text-[#06b6d4]" />
            {t('settings.dataPrivacy')}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-medium">{t('settings.exportProgress')}</p>
                <p className="text-slate-400 text-sm">
                  {t('settings.exportDesc')}
                </p>
              </div>
              <Button 
                onClick={handleExportProgress}
                variant="outline"
                className="border-white/10 text-slate-300 hover:bg-white/5 rounded-full ml-auto md:ml-0"
              >
                <Download size={18} className="mr-2" />
                {t('settings.export')}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="text-white font-medium">{t('settings.clearProgress')}</p>
                <p className="text-slate-400 text-sm">
                  {t('settings.clearDesc')}
                </p>
              </div>
              <Button 
                onClick={handleClearProgress}
                variant="outline"
                className="border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded-full ml-auto md:ml-0"
              >
                {t('settings.clear')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-[#1a1a2e] border-[#ef4444]/20 p-6">
          <h2 className="text-lg font-semibold text-[#ef4444] mb-6 flex items-center gap-2">
            <Trash2 size={20} />
            {t('settings.dangerZone')}
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-[#ef4444]/10 rounded-xl flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-white font-medium">{t('settings.deleteAccount')}</p>
              <p className="text-slate-400 text-sm">
                {t('settings.deleteDesc')}
              </p>
            </div>
            <Button 
              onClick={handleDeleteAccount}
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-full ml-auto md:ml-0"
            >
              {t('settings.delete')}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Settings;
