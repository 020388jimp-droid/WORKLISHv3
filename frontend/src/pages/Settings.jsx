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
  BookOpen
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Sidebar } from '../components/Sidebar';
import { LevelSelector } from '../components/LevelSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { getProgress } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, LANGUAGE_LEVELS } from '../contexts/LanguageContext';
import { Toaster, toast } from 'sonner';

export const Settings = () => {
  const navigate = useNavigate();
  const { userProfile, logout, isAuthenticated } = useAuth();
  const progress = getProgress();
  const { t, level, setLevel, currentLevel } = useLanguage();
  const [showLevelDialog, setShowLevelDialog] = useState(false);

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

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel);
    setShowLevelDialog(false);
    toast.success('Nivel actualizado');
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
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
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
                    {t('settings.currentLevel')}: {currentLevel?.name?.es || 'Principiante'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {currentLevel?.description?.es || t('settings.languageDesc')}
                  </p>
                </div>
              </div>
              
              <Dialog open={showLevelDialog} onOpenChange={setShowLevelDialog}>
                <DialogTrigger asChild>
                  <Button 
                    data-testid="change-level-btn"
                    className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full"
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

            <div className="mt-4 grid grid-cols-3 gap-3">
              {Object.values(LANGUAGE_LEVELS).map((lvl) => (
                <div 
                  key={lvl.id}
                  className={`p-3 rounded-xl text-center transition-all ${
                    level === lvl.id 
                      ? 'bg-[#7c3aed]/20 border border-[#7c3aed]/50' 
                      : 'bg-white/5'
                  }`}
                >
                  <p className="text-sm font-medium text-white mb-1">{lvl.name.es}</p>
                  <p className="text-xs text-slate-400">
                    App: {lvl.appLanguage === 'es' ? 'ES' : 'EN'}
                    {' / '}
                    Feedback: {lvl.feedbackLanguage === 'es' ? 'ES' : 'EN'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Profile */}
          <Card className="bg-[#1a1a2e] border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-[#7c3aed]" />
              {t('settings.profile')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">{userProfile?.name || 'Usuario'}</p>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={14} />
                    <span className="text-sm">{userProfile?.email || 'email@example.com'}</span>
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
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
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
              <Button className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full">
                {t('settings.upgrade')}
              </Button>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="bg-[#1a1a2e] border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Shield size={20} className="text-[#06b6d4]" />
              {t('settings.dataPrivacy')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">{t('settings.exportProgress')}</p>
                  <p className="text-slate-400 text-sm">
                    {t('settings.exportDesc')}
                  </p>
                </div>
                <Button 
                  onClick={handleExportProgress}
                  variant="outline"
                  className="border-white/10 text-slate-300 hover:bg-white/5 rounded-full"
                >
                  <Download size={18} className="mr-2" />
                  {t('settings.export')}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">{t('settings.clearProgress')}</p>
                  <p className="text-slate-400 text-sm">
                    {t('settings.clearDesc')}
                  </p>
                </div>
                <Button 
                  onClick={handleClearProgress}
                  variant="outline"
                  className="border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded-full"
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
            
            <div className="flex items-center justify-between p-4 bg-[#ef4444]/10 rounded-xl">
              <div>
                <p className="text-white font-medium">{t('settings.deleteAccount')}</p>
                <p className="text-slate-400 text-sm">
                  {t('settings.deleteDesc')}
                </p>
              </div>
              <Button 
                onClick={handleDeleteAccount}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-full"
              >
                {t('settings.delete')}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
