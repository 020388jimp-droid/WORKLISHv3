import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { apiRequest, setToken, setUser, getToken } from '../lib/utils';
import { Toaster, toast } from 'sonner';

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    // Redirect if already logged in
    if (getToken()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setToken(data.access_token);
      setUser(data.user);
      toast.success(isLogin ? '¡Bienvenido de vuelta!' : '¡Cuenta creada exitosamente!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      
    } catch (error) {
      toast.error(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] noise flex items-center justify-center p-6">
      <Toaster position="top-center" richColors />
      
      {/* Background decoration */}
      <div className="fixed inset-0 gradient-hero pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Volver al inicio</span>
        </Link>

        <Card 
          data-testid="auth-card"
          className="glass-strong rounded-3xl p-8 border-white/10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-['Outfit'] text-white mb-2">
              Work<span className="text-[#7c3aed]">lish</span>
            </h1>
            <p className="text-slate-400">
              {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratuita'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex p-1 bg-white/5 rounded-full mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              data-testid="login-tab"
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-[#7c3aed] text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              data-testid="register-tab"
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-[#7c3aed] text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Nombre completo
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    data-testid="name-input"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#7c3aed] h-12"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  data-testid="email-input"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#7c3aed] h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="password-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-[#7c3aed] h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <a href="#" className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}

            <Button
              type="submit"
              data-testid="auth-submit"
              disabled={loading}
              className="w-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white h-12 rounded-full font-semibold glow-primary transition-all"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isLogin ? (
                'Iniciar Sesión'
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1a1a2e] text-slate-500">o continúa con</span>
            </div>
          </div>

          {/* Social login (placeholder) */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10 text-slate-300 hover:bg-white/5 h-12 rounded-full"
            disabled
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google (Próximamente)
          </Button>

          {/* Terms */}
          {!isLogin && (
            <p className="text-center text-xs text-slate-500 mt-6">
              Al registrarte, aceptas nuestros{' '}
              <a href="#" className="text-[#7c3aed] hover:underline">Términos</a>
              {' '}y{' '}
              <a href="#" className="text-[#7c3aed] hover:underline">Política de Privacidad</a>
            </p>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
