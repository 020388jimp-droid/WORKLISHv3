import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PenTool, 
  Mic, 
  Video, 
  Target, 
  Zap, 
  ArrowLeft,
  Briefcase,
  Globe,
  TrendingUp,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';

export const FeaturesPage = () => {
  const { appLang } = useLanguage();
  const isEn = appLang === 'en';

  const features = [
    {
      icon: PenTool,
      title: isEn ? 'Writing Practice' : 'Práctica de Escritura',
      description: isEn ? 'Improve your emails, reports and presentations with real-time AI corrections.' : 'Mejora tus emails, reportes y presentaciones con correcciones de IA en tiempo real.',
      color: '#7c3aed',
      details: isEn ? [
        'Correct grammar and style',
        'Professional business vocabulary',
        'Tone and impact analysis',
        'AI teacher tips'
      ] : [
        'Corrección gramatical y de estilo',
        'Vocabulario profesional de negocios',
        'Análisis de tono e impacto',
        'Tips de profesor de IA'
      ]
    },
    {
      icon: Mic,
      title: isEn ? 'Voice Training' : 'Entrenamiento de Voz',
      description: isEn ? 'Perfect your pronunciation with instant feedback and personalized tips.' : 'Perfecciona tu pronunciación con retroalimentación instantánea y tips personalizados.',
      color: '#06b6d4',
      details: isEn ? [
        'Phonetic analysis',
        'Intonation practice',
        'Common mistakes detection',
        'Native speaker reference'
      ] : [
        'Análisis fonético detallado',
        'Práctica de entonación',
        'Detección de errores comunes',
        'Referencia de hablante nativo'
      ]
    },
    {
      icon: Video,
      title: isEn ? 'AI Video Call' : 'Video Llamada con IA',
      description: isEn ? 'Practice work conversations in real-time with an interactive AI tutor.' : 'Practica conversaciones laborales en tiempo real con un tutor de IA interactivo.',
      color: '#10b981',
      details: isEn ? [
        'Real-time simulation',
        'Interactive AI avatar',
        'Immediate feedback',
        'Context-based scenarios'
      ] : [
        'Simulación en tiempo real',
        'Avatar de IA interactivo',
        'Feedback inmediato',
        'Escenarios basados en contexto'
      ]
    },
    {
      icon: Target,
      title: isEn ? 'Professional Focus' : 'Enfoque Profesional',
      description: isEn ? 'Content designed for real work situations: meetings, negotiations and more.' : 'Contenido diseñado para situaciones reales del trabajo: reuniones, negociaciones y más.',
      color: '#f59e0b',
      details: isEn ? [
        'Specialized terminology',
        'Interview prep',
        'Negotiation scripts',
        'Meeting idioms'
      ] : [
        'Terminología especializada',
        'Preparación de entrevistas',
        'Guiones de negociación',
        'Idioms de reuniones'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a] noise">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <Link to="/" className="inline-flex items-center text-[#7c3aed] hover:text-[#8b5cf6] mb-8 font-medium transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              {isEn ? 'Back to Home' : 'Volver al Inicio'}
            </Link>
            <h1 className="text-5xl md:text-7xl font-bold font-['Outfit'] text-white mb-6">
              {isEn ? 'Work-Ready ' : 'Inglés para el '}
              <span className="text-gradient">{isEn ? 'Features' : 'Mundo Laboral'}</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              {isEn 
                ? 'We built the tools professionals actually need to communicate in global business environments.' 
                : 'Hemos creado las herramientas que los profesionales realmente necesitan para comunicarse en entornos de negocios globales.'}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="bg-[#1a1a2e] border-white/5 p-10 h-full rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-20 transition-opacity group-hover:opacity-40"
                    style={{ backgroundColor: feature.color }}
                  />
                  
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <feature.icon size={32} style={{ color: feature.color }} />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-4 font-['Outfit']">{feature.title}</h3>
                  <p className="text-lg text-slate-400 mb-8 leading-relaxed italic">{feature.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feature.details.map((detail) => (
                      <div key={detail} className="flex items-center gap-2 text-slate-300">
                        <Check size={18} className="text-[#10b981]" />
                        <span className="text-sm font-medium">{detail}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white font-['Outfit'] mb-4">
                {isEn ? 'And more included in your plan...' : 'Y más incluido en tu plan...'}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Globe, title: isEn ? '24/7 Availability' : 'Disponibilidad 24/7', desc: isEn ? 'Practice whenever and wherever you want.' : 'Practica cuando quieras y desde donde quieras.' },
                { icon: Briefcase, title: isEn ? 'Expert Scenarios' : 'Escenarios Expertos', desc: isEn ? 'Created by business English trainers.' : 'Creados por entrenadores de inglés de negocios.' },
                { icon: TrendingUp, title: isEn ? 'Metrics Dashboard' : 'Métricas Detalladas', desc: isEn ? 'Track your evolution with advanced data.' : 'Sigue tu evolución con datos precisos de mejora.' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 text-center hover:bg-white/[0.05] transition-all">
                  <div className="w-12 h-12 bg-[#7c3aed]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon size={24} className="text-[#7c3aed]" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <Link to="/auth?mode=register">
              <Button 
                className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-lg px-10 py-7 rounded-full font-black shadow-xl shadow-[#7c3aed]/20 transition-all hover:scale-105 active:scale-95"
              >
                {isEn ? 'Unlock all features now' : 'Accede a todas las funciones ahora'}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold font-['Outfit'] text-white">
            Work<span className="text-[#7c3aed]">lish</span>
          </span>
          <p className="text-slate-500 text-sm">
            © 2024 Worklish. {isEn ? 'All rights reserved.' : 'Todos los derechos reservados.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
