import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Zap, Loader2, Shield, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { RevenueCatService } from '../lib/revenuecat';

export const PricingPage = () => {
  const { appLang } = useLanguage();
  const { isAuthenticated, userProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [rcOfferings, setRcOfferings] = useState(null);
  const isEn = appLang === 'en';

  // Determine current user plan tier (0=free, 1=pro, 2=enterprise)
  const currentStatus = userProfile?.subscription_status || 'free';
  const planTier = { free: 0, trial: 0, pro: 1, enterprise: 2 };
  const userTier = planTier[currentStatus] ?? 0;

  // Cargar ofertas de RevenueCat
  useEffect(() => {
    const loadOfferings = async () => {
      if (Capacitor.isNativePlatform()) {
        const offerings = await RevenueCatService.getOfferings();
        if (offerings && offerings.current) {
          setRcOfferings(offerings.current);
        }
      }
    };
    loadOfferings();
  }, []);

  const getPrice = (planId, defaultPrice) => {
    if (!rcOfferings) return defaultPrice;
    
    // Buscar el paquete correspondiente en el offering de RevenueCat
    // Normalmente mapeamos por identificador de paquete (ej. 'pro_monthly')
    const pkg = rcOfferings.availablePackages.find(p => 
      p.identifier.toLowerCase().includes(planId.toLowerCase())
    );
    
    return pkg ? pkg.product.priceString : defaultPrice;
  };

  const plans = [
    {
      id: 'free',
      tier: 0,
      productId: null,
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
      id: 'pro',
      tier: 1,
      productId: 'pro_monthly', // ID del paquete en RevenueCat
      name: 'Pro',
      price: getPrice('pro', '$9.99'),
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
      id: 'enterprise',
      tier: 2,
      productId: 'enterprise_monthly',
      name: 'Enterprise',
      price: getPrice('enterprise', '$19.99'),
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
    }
  ];

  const isCurrentPlan = (plan) => {
    if (!isAuthenticated) return false;
    if (plan.id === 'free' && (currentStatus === 'free' || currentStatus === 'trial')) return true;
    return plan.id === currentStatus;
  };

  const getCtaLabel = (plan) => {
    if (!isAuthenticated) return plan.cta;
    if (isCurrentPlan(plan)) return isEn ? '✓ Current Plan' : '✓ Tu Plan Actual';
    if (plan.tier < userTier) return isEn ? 'Included' : 'Incluido';
    return plan.cta;
  };

  const isButtonDisabled = (plan) => {
    if (isProcessing) return true;
    if (!isAuthenticated) return false;
    return plan.tier <= userTier;
  };

  const handlePurchase = async (plan) => {
    if (!isAuthenticated) {
      navigate('/auth?mode=register');
      return;
    }

    if (plan.id === 'free') {
      navigate('/dashboard');
      return;
    }

    if (plan.tier <= userTier) return;

    setIsProcessing(true);
    try {
      if (Capacitor.isNativePlatform()) {
        if (!rcOfferings) {
          toast.error(isEn ? 'Offerings not loaded. Please try again.' : 'Ofertas no cargadas. Intenta de nuevo.');
          return;
        }

        // Buscar el paquete en RevenueCat
        const pkg = rcOfferings.availablePackages.find(p => 
          p.identifier.toLowerCase().includes(plan.id.toLowerCase())
        );

        if (!pkg) {
          toast.error(isEn ? 'Product not found in store.' : 'Producto no encontrado en la tienda.');
          return;
        }

        const customerInfo = await RevenueCatService.purchasePackage(pkg);

        // Verificar si el entitlement está activo
        const entitlementId = plan.id === 'pro' ? 'pro' : 'enterprise';
        if (customerInfo.entitlements.active[entitlementId]) {
          await updateProfile({ subscription_status: plan.id });
          toast.success(isEn ? 'Subscription upgraded successfully!' : '¡Suscripción mejorada con éxito!');
          navigate('/dashboard');
        }
      } else {
        toast.info(isEn 
          ? 'Subscriptions are available through the Android app via Google Play.' 
          : 'Las suscripciones están disponibles a través de la app de Android en Google Play.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      if (error.userCancelled) {
        toast.info(isEn ? 'Purchase cancelled' : 'Compra cancelada');
      } else {
        toast.error(isEn ? 'An error occurred during purchase' : 'Ocurrió un error durante la compra');
      }
    } finally {
      setIsProcessing(false);
    }
  };

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
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="inline-flex items-center text-[#7c3aed] hover:text-[#8b5cf6] mb-8 font-medium transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              {isAuthenticated 
                ? (isEn ? 'Back to Dashboard' : 'Volver al Dashboard')
                : (isEn ? 'Back to Home' : 'Volver al Inicio')}
            </Link>
            <h1 className="text-5xl md:text-7xl font-bold font-['Outfit'] text-white mb-6">
              {isEn ? 'Plans & ' : 'Planes y '}
              <span className="text-gradient">{isEn ? 'Pricing' : 'Precios'}</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {isEn 
                ? 'Choose the plan that best fits your professional goals.' 
                : 'Elige el plan que mejor se adapte a tus objetivos profesionales.'}
            </p>

            {isAuthenticated && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30"
              >
                <Crown size={16} className="text-[#f59e0b]" />
                <span className="text-white font-bold text-sm capitalize">
                  {isEn ? 'Your plan: ' : 'Tu plan: '}{currentStatus}
                </span>
              </motion.div>
            )}
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
                    isCurrentPlan(plan)
                      ? 'bg-gradient-to-b from-[#10b981]/20 to-[#1a1a2e] border-[#10b981]/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                      : plan.popular && !isAuthenticated
                        ? 'bg-gradient-to-b from-[#7c3aed]/20 to-[#1a1a2e] border-[#7c3aed]/50 shadow-[0_0_40px_rgba(124,58,237,0.15)]' 
                        : 'bg-[#1a1a2e] border-white/5 shadow-xl'
                  } rounded-[2.5rem]`}
                >
                  {isCurrentPlan(plan) && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-[#10b981] rounded-full text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={14} />
                      {isEn ? 'Active' : 'Activo'}
                    </div>
                  )}
                  {plan.popular && !isCurrentPlan(plan) && !isAuthenticated && (
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
                  
                  <div className="mt-auto">
                    <Button 
                      onClick={() => handlePurchase(plan)}
                      disabled={isButtonDisabled(plan)}
                      className={`w-full h-14 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center ${
                        isCurrentPlan(plan)
                          ? 'bg-[#10b981]/20 text-[#10b981] border-2 border-[#10b981]/30 cursor-default'
                          : plan.tier < userTier
                            ? 'bg-white/5 text-slate-500 border border-white/5 cursor-default'
                            : plan.popular 
                              ? 'bg-[#7c3aed] hover:bg-[#8b5cf6] text-white shadow-lg shadow-[#7c3aed]/25' 
                              : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : getCtaLabel(plan)}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

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
