import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  Zap,
  Check,
  Mic
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Navbar } from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';

export const LandingPage = () => {
  const { appLang } = useLanguage();
  const isEn = appLang === 'en';

  return (
    <div className="min-h-screen bg-[#0f0f1a] noise">
      <Navbar transparent />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden gradient-hero">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/30 mb-6">
                <Zap size={16} className="text-[#7c3aed]" />
                <span className="text-sm text-[#7c3aed] font-medium">{isEn ? 'AI Powered' : 'Potenciado con IA'}</span>
              </div>
              
              <h1 
                data-testid="hero-title"
                className="text-5xl md:text-7xl font-bold font-['Outfit'] text-white leading-tight mb-6"
              >
                {isEn ? 'Master ' : 'Domina el '}
                <span className="text-gradient">English</span>
                <br />
                {isEn ? 'for Work' : 'para el Trabajo'}
              </h1>
              
              <p className="text-xl text-slate-300 leading-relaxed mb-8 max-w-lg">
                {isEn ? (
                  <>The fusion of <strong className="text-white">Work + English</strong>. Practice writing, pronunciation and conversation with AI specialized in work contexts.</>
                ) : (
                  <>La fusión de <strong className="text-white">Work + English</strong>. Practica escritura, pronunciación y conversación con IA especializada en contextos laborales.</>
                )}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/auth?mode=register">
                  <Button 
                    data-testid="hero-cta"
                    className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-lg px-8 py-6 rounded-full glow-primary transition-all hover:scale-105"
                  >
                    {isEn ? 'Start Free' : 'Comenzar Gratis'}
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/5 text-lg px-8 py-6 rounded-full"
                  >
                    {isEn ? 'View Features' : 'Ver Características'}
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
                <div>
                  <p className="text-3xl font-bold text-white">10K+</p>
                  <p className="text-slate-400 text-sm">{isEn ? 'Active users' : 'Usuarios activos'}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">95%</p>
                  <p className="text-slate-400 text-sm">{isEn ? 'Reported improvement' : 'Mejora reportada'}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">4.9</p>
                  <p className="text-slate-400 text-sm">{isEn ? 'Rating' : 'Calificación'}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
                    alt="Professional working"
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
                </div>
                
                <motion.div 
                  className="absolute top-10 -left-8 glass rounded-2xl p-4 shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                      <Check className="text-[#10b981]" size={20} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Grammar Check</p>
                      <p className="text-[#10b981] text-xs">100% correcto</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute bottom-20 -right-8 glass rounded-2xl p-4 shadow-xl"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#06b6d4]/20 flex items-center justify-center pulse-ai">
                      <Mic className="text-[#06b6d4]" size={20} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Pronunciation</p>
                      <p className="text-[#06b6d4] text-xs">Excellent clarity</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-6 bg-[#1a1a2e]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold font-['Outfit'] text-white mb-6">
            {isEn ? 'Most professionals struggle to apply their English at work.' : 'La mayoría de profesionales luchan por aplicar su inglés en el trabajo.'}{' '}
            <span className="text-[#06b6d4]">{isEn ? 'Worklish is here to change that.' : 'Worklish está aquí para cambiar eso.'}</span>
          </h2>
          <p className="text-lg text-slate-400">
            {isEn ? 'Train with real scenarios: interviews, presentations, negotiations and more.' : 'Entrena con escenarios reales: entrevistas, presentaciones, negociaciones y más.'}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-t from-[#7c3aed]/20 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-['Outfit'] text-white mb-6">
            {isEn ? 'Try Worklish Now!' : '¡Prueba Worklish Ahora!'}
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            {isEn ? 'Make learning English for work fun and efficient.' : 'Haz que aprender inglés para el trabajo sea divertido y eficiente.'}
          </p>
          <Link to="/auth?mode=register">
            <Button 
              data-testid="cta-bottom"
              className="bg-white text-[#0f0f1a] hover:bg-slate-100 text-lg px-10 py-6 rounded-full font-semibold transition-all hover:scale-105"
            >
              {isEn ? 'Start practicing free' : 'Comienza a practicar gratis'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-['Outfit'] text-white">
              Work<span className="text-[#7c3aed]">lish</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2024 Worklish. {isEn ? 'All rights reserved.' : 'Todos los derechos reservados.'}
          </p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">{isEn ? 'Privacy' : 'Privacidad'}</a>
            <a href="#" className="hover:text-white transition-colors">{isEn ? 'Terms' : 'Términos'}</a>
            <a href="#" className="hover:text-white transition-colors">{isEn ? 'Contact' : 'Contacto'}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
