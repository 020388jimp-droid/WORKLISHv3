import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenTool, 
  Mic, 
  Video, 
  Settings, 
  LogOut,
  Flame,
  Crown
} from 'lucide-react';
import { getProgress } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Progress } from './ui/progress';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const progress = getProgress();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/practice/text', icon: PenTool, label: 'Escritura' },
    { path: '/practice/voice', icon: Mic, label: 'Pronunciación' },
    { path: '/practice/video', icon: Video, label: 'Video Call' },
    { path: '/settings', icon: Settings, label: 'Configuración' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside 
      data-testid="main-sidebar"
      className="fixed left-0 top-0 h-full w-64 bg-[#0f0f1a] border-r border-white/5 flex flex-col z-50"
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold font-['Outfit'] text-white">
            Work<span className="text-[#7c3aed]">lish</span>
          </span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center">
            <span className="text-white font-semibold">
              {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{userProfile?.name || 'Usuario'}</p>
            <div className="flex items-center gap-1 text-xs text-[#06b6d4]">
              <Crown size={12} />
              <span className="capitalize">{userProfile?.subscription_status || 'Trial'}</span>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame size={16} className="fill-orange-400" />
            <span className="font-bold">{progress.streak || 0}</span>
          </div>
          <span className="text-slate-400">días de racha</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.path.split('/').pop()}`}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-[#7c3aed]/20 text-[#7c3aed] border border-[#7c3aed]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Daily progress */}
      <div className="p-4 mx-4 mb-4 rounded-xl bg-[#1a1a2e] border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progreso diario</span>
          <span className="text-sm font-bold text-[#06b6d4]">
            {Math.min(100, (progress.textSessions + progress.voiceSessions + progress.videoSessions) * 20)}%
          </span>
        </div>
        <Progress 
          value={Math.min(100, (progress.textSessions + progress.voiceSessions + progress.videoSessions) * 20)} 
          className="h-2 bg-white/10"
        />
        <p className="text-xs text-slate-500 mt-2">
          Meta: 5 sesiones diarias
        </p>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          data-testid="sidebar-logout"
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
