import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { getToken, removeToken, removeUser } from '../lib/utils';

export const Navbar = ({ transparent = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState('ES');
  const navigate = useNavigate();
  const isAuthenticated = !!getToken();

  const handleLogout = () => {
    removeToken();
    removeUser();
    navigate('/');
  };

  const toggleLang = () => {
    setLang(lang === 'ES' ? 'EN' : 'ES');
  };

  return (
    <nav 
      data-testid="main-navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        transparent ? 'bg-transparent' : 'glass-strong'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          data-testid="navbar-logo"
          className="flex items-center gap-2"
        >
          <span className="text-2xl font-bold font-['Outfit'] text-white">
            Work<span className="text-[#7c3aed]">lish</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {!isAuthenticated ? (
            <>
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">
                {lang === 'ES' ? 'Características' : 'Features'}
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">
                {lang === 'ES' ? 'Precios' : 'Pricing'}
              </a>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link to="/practice/text" className="text-slate-300 hover:text-white transition-colors">
                {lang === 'ES' ? 'Escritura' : 'Writing'}
              </Link>
              <Link to="/practice/voice" className="text-slate-300 hover:text-white transition-colors">
                {lang === 'ES' ? 'Voz' : 'Voice'}
              </Link>
              <Link to="/practice/video" className="text-slate-300 hover:text-white transition-colors">
                {lang === 'ES' ? 'Video' : 'Video'}
              </Link>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language toggle */}
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
                  {lang === 'ES' ? 'Iniciar Sesión' : 'Login'}
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
              {lang === 'ES' ? 'Cerrar Sesión' : 'Logout'}
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
          data-testid="mobile-menu-btn"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden glass-strong border-t border-white/5">
          <div className="px-6 py-4 space-y-4">
            {!isAuthenticated ? (
              <>
                <a href="#features" className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Características' : 'Features'}
                </a>
                <a href="#pricing" className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Precios' : 'Pricing'}
                </a>
                <Link to="/auth" className="block">
                  <Button variant="ghost" className="w-full justify-start text-slate-300">
                    {lang === 'ES' ? 'Iniciar Sesión' : 'Login'}
                  </Button>
                </Link>
                <Link to="/auth?mode=register" className="block">
                  <Button className="w-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white">
                    {lang === 'ES' ? 'Comenzar Gratis' : 'Start Free'}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="block text-slate-300 hover:text-white py-2">
                  Dashboard
                </Link>
                <Link to="/practice/text" className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Escritura' : 'Writing'}
                </Link>
                <Link to="/practice/voice" className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Voz' : 'Voice'}
                </Link>
                <Link to="/practice/video" className="block text-slate-300 hover:text-white py-2">
                  {lang === 'ES' ? 'Video' : 'Video'}
                </Link>
                <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-300">
                  {lang === 'ES' ? 'Cerrar Sesión' : 'Logout'}
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
