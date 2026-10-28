import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { LevelSelector } from '../components/LevelSelector';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { resetPassword } from '../lib/firebase';
import { Toaster, toast } from 'sonner';

export const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, googleLogin, isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const { t, setLevel, level } = useLanguage();
  
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(level);
  const [showResend, setShowResend] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    setStep(1);
    setShowResend(false);
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLogin && step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const user = await login(formData.email, formData.password);
        if (!user.emailVerified) {
          throw new Error('email-not-verified');
        }
        toast.success(t('auth.welcomeBack'));
      } else {
        await register(formData.email, formData.password, formData.name);
        setLevel(selectedLevel);
        localStorage.setItem('worklish_language_level', selectedLevel);
        // Quitamos el logout automático para permitir el reenvío si es necesario
        toast.success('Cuenta creada. Revisa tu bandeja de entrada para verificar tu correo.');
        setStep(1);
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: '' }));
        setLoading(false);
        return; // Salir para no navegar al dashboard
      }
      // La navegación al dashboard se maneja por el useEffect que espera isAuthenticated
      
    } catch (error) {
      console.error('Auth error:', error);
      let errorMessage = 'Error al procesar la solicitud';
      
      if (error.message === 'email-not-verified') {
        errorMessage = 'Por favor, verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o spam.';
        setShowResend(true);
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Tu correo no aparece en el sistema. ¿Quieres registrarte?';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta. Por favor, verifica tus datos.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'El correo o la contraseña son incorrectos. Verifica tus datos.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo ya tiene una cuenta activa. Intenta iniciar sesión.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato de correo es inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Tu cuenta ha sido bloqueada temporalmente.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      // Intentamos re-enviar usando el auth.currentUser que quedó de la sesión fallida
      const { auth, sendEmailVerification } = await import('../lib/firebase');
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success('¡Enlace de verificación reenviado! Revisa tu correo.');
        setShowResend(false);
      } else {
        toast.error('Sesión expirada. Por favor, intenta iniciar sesión de nuevo.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Error al reenviar el correo. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await googleLogin();
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Error al iniciar sesión con Google');
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

  const handleLevelSelect = (levelId) => {
    setSelectedLevel(levelId);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] noise flex items-center justify-center p-6">
      <Toaster position="top-center" richColors />
      
      <div className="fixed inset-0 gradient-hero pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={step === 2 ? handleBack : undefined}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          {step === 2 ? (
            <span>Volver</span>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2">
              {t('auth.backHome')}
            </Link>
          )}
        </button>

        <Card 
          data-testid="auth-card"
          className="glass-strong rounded-3xl p-8 border-white/10"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-['Outfit'] text-white mb-2">
              Work<span className="text-[#7c3aed]">lish</span>
            </h1>
            <p className="text-slate-400">
              {step === 1 
                ? (isLogin ? t('auth.loginTitle') : t('auth.registerTitle'))
                : t('auth.selectLevel')
              }
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
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
                    {t('auth.login')}
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
                    {t('auth.register')}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">
                        {t('auth.name')}
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          data-testid="name-input"
                          placeholder={t('auth.namePlaceholder')}
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
                      {t('auth.email')}
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
                      {t('auth.password')}
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
                      <button 
                        type="button"
                        onClick={async () => {
                          const email = formData.email?.trim();
                          if (!email) {
                            toast.error('Escribe tu correo electrónico primero en el campo de arriba.');
                            return;
                          }
                          try {
                            await resetPassword(email);
                            toast.success(`Se envió un enlace de recuperación a ${email}. Revisa tu bandeja de entrada (y spam).`);
                          } catch (err) {
                            if (err.code === 'auth/user-not-found') {
                              toast.error('No hay ninguna cuenta con ese correo.');
                            } else if (err.code === 'auth/invalid-email') {
                              toast.error('El correo no es válido.');
                            } else {
                              toast.error('Error al enviar el correo de recuperación.');
                            }
                          }
                        }}
                        className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] transition-colors cursor-pointer"
                      >
                        {t('auth.forgotPassword')}
                      </button>
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
                      t('auth.login')
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="ml-2" size={18} />
                      </>
                    )}
                  </Button>

                  {isLogin && showResend && (
                    <div className="text-center mt-4">
                      <p className="text-xs text-slate-400 mb-1">¿No recibiste el correo?</p>
                      <button 
                        type="button"
                        onClick={handleResendVerification}
                        className="text-sm font-medium text-[#7c3aed] hover:text-[#8b5cf6] underline underline-offset-4"
                      >
                        Reenviar enlace de verificación
                      </button>
                    </div>
                  )}
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#1a1a2e] text-slate-500">{t('auth.continueWith')}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full border-white/10 text-slate-300 hover:bg-white/5 h-12 rounded-full"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>

                {!isLogin && (
                  <p className="text-center text-xs text-slate-500 mt-6">
                    {t('auth.terms')}{' '}
                    <a href="#" className="text-[#7c3aed] hover:underline">{t('auth.termsLink')}</a>
                    {' '}{t('common.and')}{' '}
                    <Link to="/privacy" target="_blank" className="text-[#7c3aed] hover:underline">{t('auth.privacyLink')}</Link>
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <LevelSelector 
                  currentLevel={selectedLevel} 
                  onSelect={handleLevelSelect}
                  showTitle={false}
                />

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  data-testid="complete-registration"
                  className="w-full mt-6 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white h-12 rounded-full font-semibold glow-primary transition-all"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    t('auth.createAccount')
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
