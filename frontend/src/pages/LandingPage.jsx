import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PenTool, 
  Mic, 
  Video, 
  Target, 
  TrendingUp, 
  Briefcase,
  Check,
  ArrowRight,
  Zap,
  Globe,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Navbar } from '../components/Navbar';

export const LandingPage = () => {
  const features = [
    {
      icon: PenTool,
      title: 'Práctica de Escritura',
      description: 'Mejora tus emails, reportes y presentaciones con correcciones de IA en tiempo real.',
      color: '#7c3aed'
    },
    {
      icon: Mic,
      title: 'Entrenamiento de Voz',
      description: 'Perfecciona tu pronunciación con retroalimentación instantánea y tips personalizados.',
      color: '#06b6d4'
    },
    {
      icon: Video,
      title: 'Video Llamada con IA',
      description: 'Practica conversaciones laborales en tiempo real con un tutor de IA interactivo.',
      color: '#10b981'
    },
    {
      icon: Target,
      title: 'Enfoque Profesional',
      description: 'Contenido diseñado para situaciones reales del trabajo: reuniones, negociaciones y más.',
      color: '#f59e0b'
    }
  ];

  const plans = [
    {
      name: 'Gratis',
      price: '$0',
      period: 'siempre',
      features: [
        '5 correcciones de texto/día',
        '2 prácticas de voz/día',
        'Acceso básico a tips',
        'Progreso local guardado'
      ],
      cta: 'Comenzar Gratis',
      popular: false
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: '/mes',
      features: [
        'Correcciones ilimitadas',
        'Prácticas de voz ilimitadas',
        '30 minutos de video call/mes',
        'Escenarios avanzados',
        'Análisis de progreso detallado',
        'Soporte prioritario'
      ],
      cta: 'Probar 7 días gratis',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$29.99',
      period: '/mes',
      features: [
        'Todo en Pro',
        'Video calls ilimitadas',
        'Escenarios personalizados',
        'Reportes de equipo',
        'API access',
        'Account manager dedicado'
      ],
      cta: 'Contactar Ventas',
      popular: false
    }
  ];

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
                <span className="text-sm text-[#7c3aed] font-medium">Potenciado con IA</span>
              </div>
              
              <h1 
                data-testid="hero-title"
                className="text-5xl md:text-7xl font-bold font-['Outfit'] text-white leading-tight mb-6"
              >
                Domina el{' '}
                <span className="text-gradient">Inglés</span>
                <br />
                para el Trabajo
              </h1>
              
              <p className="text-xl text-slate-300 leading-relaxed mb-8 max-w-lg">
                La fusión de <strong className="text-white">Work + English</strong>. 
                Practica escritura, pronunciación y conversación con IA especializada en contextos laborales.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/auth?mode=register">
                  <Button 
                    data-testid="hero-cta"
                    className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-lg px-8 py-6 rounded-full glow-primary transition-all hover:scale-105"
                  >
                    Comenzar Gratis
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <a href="#features">
                  <Button 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/5 text-lg px-8 py-6 rounded-full"
                  >
                    Ver Características
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
                <div>
                  <p className="text-3xl font-bold text-white">10K+</p>
                  <p className="text-slate-400 text-sm">Usuarios activos</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">95%</p>
                  <p className="text-slate-400 text-sm">Mejora reportada</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">4.9</p>
                  <p className="text-slate-400 text-sm">Calificación</p>
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
                {/* AI Core visual */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
                    alt="Professional working"
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
                </div>
                
                {/* Floating cards */}
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
            La mayoría de profesionales luchan por aplicar su inglés en el trabajo.{' '}
            <span className="text-[#06b6d4]">Worklish está aquí para cambiar eso.</span>
          </h2>
          <p className="text-lg text-slate-400">
            Entrena con escenarios reales: entrevistas, presentaciones, negociaciones y más.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-['Outfit'] text-white mb-4">
              ¿Por qué Worklish?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Herramientas diseñadas específicamente para profesionales que quieren destacar en inglés.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card 
                  data-testid={`feature-card-${index}`}
                  className="bg-[#1a1a2e] border-white/5 p-8 h-full hover:border-[#7c3aed]/30 transition-all group"
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <feature.icon size={28} style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-[#1a1a2e]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-['Outfit'] text-white mb-4">
              Cómo Funciona
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Elige tu práctica', desc: 'Texto, voz o video call según tu objetivo del día.', icon: Target },
              { step: '02', title: 'Practica con IA', desc: 'Recibe correcciones y tips en tiempo real.', icon: Zap },
              { step: '03', title: 'Mide tu progreso', desc: 'Visualiza tu mejora con métricas detalladas.', icon: TrendingUp }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="glass rounded-3xl p-8 text-center">
                  <span className="text-6xl font-bold text-[#7c3aed]/20 font-['Outfit']">{item.step}</span>
                  <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/20 flex items-center justify-center mx-auto -mt-4 mb-4">
                    <item.icon size={32} className="text-[#7c3aed]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-['Outfit'] text-white mb-4">
              Planes y Precios
            </h2>
            <p className="text-lg text-slate-400">
              Comienza gratis, escala cuando estés listo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card 
                  data-testid={`pricing-card-${plan.name.toLowerCase()}`}
                  className={`relative p-8 h-full ${
                    plan.popular 
                      ? 'bg-gradient-to-b from-[#7c3aed]/20 to-[#1a1a2e] border-[#7c3aed]/50 glow-primary' 
                      : 'bg-[#1a1a2e] border-white/5'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#7c3aed] rounded-full text-sm font-medium text-white">
                      Más Popular
                    </div>
                  )}
                  
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-slate-300">
                        <Check size={18} className="text-[#10b981] flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/auth?mode=register">
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-[#7c3aed] hover:bg-[#8b5cf6] text-white' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      } rounded-full py-6`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-t from-[#7c3aed]/20 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-['Outfit'] text-white mb-6">
            ¡Prueba Worklish Ahora!
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Haz que aprender inglés para el trabajo sea divertido y eficiente.
          </p>
          <Link to="/auth?mode=register">
            <Button 
              data-testid="cta-bottom"
              className="bg-white text-[#0f0f1a] hover:bg-slate-100 text-lg px-10 py-6 rounded-full font-semibold transition-all hover:scale-105"
            >
              Comienza a practicar gratis
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
            © 2024 Worklish. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
