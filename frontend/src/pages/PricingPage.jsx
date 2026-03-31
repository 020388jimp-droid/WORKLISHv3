import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';

export const PricingPage = () => {
  const { appLang } = useLanguage();
  const isEn = appLang === 'en';

  const plans = [
    {
      name: isEn ? 'Free' : 'Gratis',
      price: '$0',
      period: isEn ? 'forever' : 'siempre',
      features: isEn ? [
        '5 text corrections/day',
        '2 voice practices/day',
        'Basic access to tips',
        'Saved local progress',
        'Includes ads between practices'
      ] : [
        '5 correcciones de texto/día',
        '2 prácticas de voz/día',
        'Acceso básico a tips',
        'Progreso local guardado',
        'Incluye publicidad entre prácticas'
      ],
      cta: isEn ? 'Start Free' : 'Comenzar Gratis',
      popular: false
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: isEn ? '/month' : '/mes',
      features: isEn ? [
        'Unlimited corrections',
        'Unlimited voice practices',
        '30 min video call/month',
        'Advanced scenarios',
        'Detailed progress analysis',
        'Priority support'
      ] : [
        'Correcciones ilimitadas',
        'Prácticas de voz ilimitadas',
        '30 minutos de video call/mes',
        'Escenarios avanzados',
        'Análisis de progreso detallado',
        'Soporte prioritario'
      ],
      cta: isEn ? 'Try 7 days free' : 'Probar 7 días gratis',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$19.99',
      period: isEn ? '/month' : '/mes',
      features: isEn ? [
        'Everything in Pro',
        'Unlimited video calls',
        'Custom scenarios',
        'Team reports',
        'API access',
        'Dedicated account manager'
      ] : [
        'Todo en Pro',
        'Video calls ilimitadas',
        'Escenarios personalizados',
        'Reportes de equipo',
        'API access',
        'Account manager dedicado'
      ],
      cta: isEn ? 'Contact Sales' : 'Contactar Ventas',
      popular: false
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
            className="text-center mb-16"
          >
            <Link to="/" className="inline-flex items-center text-[#7c3aed] hover:text-[#8b5cf6] mb-8 font-medium transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              {isEn ? 'Back to Home' : 'Volver al Inicio'}
            </Link>
            <h1 className="text-5xl md:text-7xl font-bold font-['Outfit'] text-white mb-6">
              {isEn ? 'Plans & ' : 'Planes y '}
              <span className="text-gradient">{isEn ? 'Pricing' : 'Precios'}</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {isEn 
                ? 'Choose the plan that best fits your professional goals. Start improving your English today.' 
                : 'Elige el plan que mejor se adapte a tus objetivos profesionales. Comienza a mejorar tu inglés hoy mismo.'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card 
                  className={`relative p-8 h-full flex flex-col ${
                    plan.popular 
                      ? 'bg-gradient-to-b from-[#7c3aed]/20 to-[#1a1a2e] border-[#7c3aed]/50 shadow-[0_0_40px_rgba(124,58,237,0.15)]' 
                      : 'bg-[#1a1a2e] border-white/5 shadow-xl'
                  } rounded-[2.5rem]`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-[#7c3aed] rounded-full text-sm font-black text-white uppercase tracking-wider">
                      {isEn ? 'Most Popular' : 'Más Popular'}
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-white mb-4 font-['Outfit']">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                      <span className="text-slate-500 font-medium">{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-slate-300 font-medium">
                        <div className="mt-1 bg-[#10b981]/20 p-0.5 rounded-full">
                          <Check size={14} className="text-[#10b981]" />
                        </div>
                        <span className="text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/auth?mode=register" className="mt-auto">
                    <Button 
                      className={`w-full h-14 rounded-2xl font-black text-lg transition-all active:scale-95 ${
                        plan.popular 
                          ? 'bg-[#7c3aed] hover:bg-[#8b5cf6] text-white shadow-lg shadow-[#7c3aed]/25' 
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-24 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm mb-8">
              <Zap size={16} className="text-[#f59e0b]" />
              {isEn ? 'Secure payment via Google Play & Stripe' : 'Pago seguro mediante Google Play y Stripe'}
            </div>
            <p className="text-slate-500 text-sm italic">
              {isEn 
                ? '* You can cancel your subscription at any time from your settings.' 
                : '* Puedes cancelar tu suscripción en cualquier momento desde tu configuración.'}
            </p>
          </motion.div>
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

export default PricingPage;
