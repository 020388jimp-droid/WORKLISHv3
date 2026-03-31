import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const Navbar = ({ transparent = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { appLang, setOverrideLang, t } = useLanguage();
  const lang = appLang.toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleLang = () => {
    setOverrideLang(appLang === 'es' ? 'en' : 'es');
  };

  return (
    <nav 
      data-testid="main-navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        transparent ? 'bg-transparent' : 'glass-strong'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link 
          to="/" 
          data-testid="navbar-logo"
          className="flex items-center gap-2"
        >
          <span className="text-2xl font-bold font-['Outfit'] text-white">
            Work<span className="text-[#7c3aed]">lish</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/features" className="text-slate-300 hover:text-white transition-colors">
            {lang === 'ES' ? 'Caracteristicas' : 'Features'}
          </Link>
          <Link to="/pricing" className="text-slate-300 hover:text-white transition-colors" id="navbar-pricing-link">
            {lang === 'ES' ? 'Precios' : 'Pricing'}
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Dashboard
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleLang}
            data-testid="lang-toggle"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Globe size={18} />
            <span className="text-sm font-medium">{lang}</span>
          </button>

          {!isAuthenticated ? (
            <>
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  data-testid="login-btn"
                  className="text-slate-300 hover:text-white"
                >
                  {lang === 'ES' ? 'Iniciar Sesion' : 'Login'}
                </Button>
              </Link>
              <Link to="/auth?mode=register">
                <Button 
                  data-testid="signup-btn"
                  className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full px-6"
                >
                  {lang === 'ES' ? 'Comenzar Gratis' : 'Start Free'}
                </Button>
              </Link>
            </>
          ) : (
            <Button 
              onClick={handleLogout}
              data-testid="logout-btn"
              variant="ghost"
              className="text-slate-300 hover:text-white"
            >
              {lang === 'ES' ? 'Cerrar Sesion' : 'Logout'}
            </Button>
          )}
        </div>

        <button 
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
          data-testid="mobile-menu-btn"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden glass-strong border-t border-white/5">
          <div className="px-6 py-4 space-y-4">
            {!isAuthenticated ? (
              <>
                <Link to="/features" onClick={() => setIsOpen(false)} className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Caracteristicas' : 'Features'}
                </Link>
                <Link to="/pricing" onClick={() => setIsOpen(false)} className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Precios' : 'Pricing'}
                </Link>
                <Link to="/auth" className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Iniciar Sesion' : 'Login'}
                </Link>
                <Link to="/auth?mode=register" className="block">
                  <Button className="w-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white">
                    {lang === 'ES' ? 'Comenzar Gratis' : 'Start Free'}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/pricing" onClick={() => setIsOpen(false)} className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Precios' : 'Pricing'}
                </Link>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block text-slate-300 hover:text-white py-2">
                  Dashboard
                </Link>
                <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-300">
                  {lang === 'ES' ? 'Cerrar Sesion' : 'Logout'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
