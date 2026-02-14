import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Crown, 
  Calendar,
  Shield,
  Trash2,
  Download
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Sidebar } from '../components/Sidebar';
import { getUser, getToken, getProgress, removeToken, removeUser } from '../lib/utils';
import { Toaster, toast } from 'sonner';

export const Settings = () => {
  const navigate = useNavigate();
  const user = getUser();
  const progress = getProgress();

  useEffect(() => {
    if (!getToken()) {
      navigate('/auth');
    }
  }, [navigate]);

  const handleExportProgress = () => {
    const data = JSON.stringify(progress, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'worklish_progress.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Progreso exportado');
  };

  const handleClearProgress = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo tu progreso local?')) {
      localStorage.removeItem('worklish_progress');
      toast.success('Progreso borrado');
      window.location.reload();
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
      removeToken();
      removeUser();
      localStorage.removeItem('worklish_progress');
      toast.success('Cuenta eliminada');
      navigate('/');
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
          className="mb-8"
        >
          <h1 
            data-testid="settings-title"
            className="text-3xl font-bold font-['Outfit'] text-white mb-2"
          >
            Configuración
          </h1>
          <p className="text-slate-400">
            Administra tu cuenta y preferencias.
          </p>
        </motion.div>

        <div className="max-w-3xl space-y-6">
          {/* Profile */}
          <Card className="bg-[#1a1a2e] border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-[#7c3aed]" />
              Perfil
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">{user?.name || 'Usuario'}</p>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={14} />
                    <span className="text-sm">{user?.email || 'email@example.com'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Subscription */}
          <Card className="bg-[#1a1a2e] border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Crown size={20} className="text-[#f59e0b]" />
              Suscripción
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-white font-medium capitalize">
                  Plan {user?.subscription_status || 'Trial'}
                </p>
                {user?.subscription_end && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    <Calendar size={14} />
                    <span>
                      Expira: {new Date(user.subscription_end).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}
              </div>
              <Button className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full">
                Mejorar Plan
              </Button>
            </div>
          </Card>

          {/* Data Management */}
          <Card className="bg-[#1a1a2e] border-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Shield size={20} className="text-[#06b6d4]" />
              Datos y Privacidad
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">Exportar Progreso</p>
                  <p className="text-slate-400 text-sm">
                    Descarga tu historial de práctica en formato JSON
                  </p>
                </div>
                <Button 
                  onClick={handleExportProgress}
                  variant="outline"
                  className="border-white/10 text-slate-300 hover:bg-white/5 rounded-full"
                >
                  <Download size={18} className="mr-2" />
                  Exportar
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">Borrar Progreso Local</p>
                  <p className="text-slate-400 text-sm">
                    Elimina todo tu progreso almacenado localmente
                  </p>
                </div>
                <Button 
                  onClick={handleClearProgress}
                  variant="outline"
                  className="border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded-full"
                >
                  Borrar
                </Button>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-[#1a1a2e] border-[#ef4444]/20 p-6">
            <h2 className="text-lg font-semibold text-[#ef4444] mb-6 flex items-center gap-2">
              <Trash2 size={20} />
              Zona de Peligro
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-[#ef4444]/10 rounded-xl">
              <div>
                <p className="text-white font-medium">Eliminar Cuenta</p>
                <p className="text-slate-400 text-sm">
                  Esta acción eliminará permanentemente tu cuenta
                </p>
              </div>
              <Button 
                onClick={handleDeleteAccount}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-full"
              >
                Eliminar
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
