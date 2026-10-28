import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const getDashboardSteps = (userProfile) => [
  {
    targetId: null, // Welcome screen
    title: "Bienvenido a Worklish",
    description: userProfile?.subscription_status === 'enterprise' 
      ? "¡Felicidades! Tienes una cuenta Enterprise con acceso ilimitado a todas nuestras herramientas profesionales."
      : "Estamos encantados de tenerle aquí. Permítanos mostrarle cómo maximizar su entrenamiento en inglés profesional.",
    position: "center"
  },
  {
    targetId: null,
    title: "Planes y Beneficios",
    description: userProfile?.subscription_status === 'enterprise'
      ? "Como usuario Enterprise, no verás anuncios y puedes realizar videollamadas ilimitadas sin restricciones de tiempo."
      : userProfile?.subscription_status === 'pro'
        ? "Tu plan Pro te ofrece una experiencia sin anuncios y sesiones de videollamada de 5 minutos cada 24 horas."
        : "Los usuarios Trial y Pro disfrutan de una experiencia libre de anuncios. Los usuarios Gratis verán anuncios entre lecciones.",
    position: "center"
  },
  {
    targetId: "main-sidebar",
    title: "Menú Principal",
    description: "Desde aquí puede navegar rápidamente entre todas las secciones de la plataforma: práctica, configuración y su resumen de actividad.",
    position: "right"
  },
  {
    targetId: "stat-card-0",
    title: "Seguimiento de Rachas",
    description: "Aquí podrá visualizar su compromiso diario. Mantener una racha activa es fundamental para la retención del idioma.",
    position: "bottom"
  },
  {
    targetId: "stat-card-3",
    title: "Rendimiento Global",
    description: "Esta métrica refleja su precisión gramatical y fluidez promedio en todas sus sesiones.",
    position: "bottom"
  },
  {
    targetId: "module-card-text",
    title: "Práctica de Escritura",
    description: "Perfeccione sus textos.",
    position: "bottom"
  },
  {
    targetId: "nav-voice",
    title: "Práctica de Pronunciación",
    description: "Mejore su acento y pronunciación con ayuda de la IA.",
    position: "right"
  },
  {
    targetId: "module-card-video",
    title: "Sesiones de Videollamada",
    description: "Simule reuniones reales para practicar conversaciones.",
    position: "top"
  },
  {
    targetId: "nav-settings",
    title: "Configuración",
    description: "Personalice su perfil, gestione su plan y elija su voz preferida.",
    position: "top"
  },
  {
    targetId: "activity-calendar",
    title: "Calendario de Actividad",
    description: "Visualice su progreso diario por semana o mes. En la vista mensual, cuanto más intenso sea el color morado, ¡más lecciones habrá completado ese día!",
    position: "top"
  }
];

const TEXT_STEPS = [
  {
    targetId: "premium-voice-toggle",
    title: "Audio Premium",
    description: "Active o desactive el audio premium. Las voces de alta fidelidad le ayudarán a escuchar la pronunciación correcta de su texto.",
    position: "bottom"
  },
  {
    targetId: "practice-scenarios",
    title: "Sugerencias Guiadas",
    description: "Haga clic aquí para usar un escenario predeterminado, o si prefiere, escriba libremente su propio texto en el recuadro inferior.",
    position: "bottom"
  },
  {
    targetId: null,
    title: "Palabras Interactivos",
    description: "Nota importante: Cualquier palabra o frase en inglés que aparezca resaltada en color morado en el feedback, ¡es interactiva! Presiónela en cualquier momento para escuchar su pronunciación exacta.",
    position: "center"
  }
];

const getHowToSaySteps = (userProfile) => [
  {
    targetId: "how-to-say-text",
    title: "¿Qué quieres expresar?",
    description: "Escribe aquí la frase o palabra que quieres aprender a decir en inglés profesional.",
    position: "bottom"
  },
  {
    targetId: "how-to-say-context",
    title: "Añade Contexto",
    description: "Opcionalmente, dinos dónde usarás esta frase (ej. en un email, en una junta). La IA adaptará la respuesta para que suenes perfecto.",
    position: "bottom"
  },
  {
    targetId: "how-to-say-submit",
    title: "Consulta a la IA",
    description: "Presiona este botón para obtener la mejor forma de decirlo, ejemplos de uso y consejos de nuestro tutor.",
    position: "top"
  },
  {
    targetId: null,
    title: "Palabras Interactivos",
    description: "¡Recuerda! Todas las palabras resaltadas en la respuesta son interactivas. Presiónalas para escuchar su pronunciación.",
    position: "center"
  }
];

const VOICE_STEPS = [
  {
    targetId: "premium-voice-toggle",
    title: "Audio Premium",
    description: "Active o desactive el audio premium para la retroalimentación de la IA.",
    position: "bottom"
  },
  {
    targetId: "practice-scenarios",
    title: "Frases Sugeridas",
    description: "Haga clic en cualquiera de las sugerencias para usarlas como referencia, o lea sus propios textos de manera libre.",
    position: "top"
  },
  {
    targetId: null,
    title: "Palabras Interactivos",
    description: "Recuerde: Cualquier texto en inglés que el Tutor IA resalte en color morado puede ser presionado para escuchar su pronunciación nuevamente.",
    position: "center"
  }
];

const getVideoSteps = (userProfile) => [
  {
    targetId: "language-flag-toggle",
    title: "Idioma a Hablar",
    description: "¡Muy importante! Cambie la bandera al idioma (Inglés o Español) en el que va a hablar para que la IA le entienda a la perfección.",
    position: "bottom"
  },
  {
    targetId: null,
    title: "Límite de Sesión",
    description: userProfile?.subscription_status === 'enterprise'
      ? "¡Disfruta! Tus videollamadas son ilimitadas. Practica todo el tiempo que necesites para perfeccionar tu fluidez."
      : "En el plan Trial y Pro, cada sesión tiene un límite de 5 minutos cada 24 horas para asegurar un aprendizaje enfocado y constante.",
    position: "center"
  }
];

export const OnboardingTutorial = () => {
  const { userProfile, updateProfile } = useAuth();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [tourSteps, setTourSteps] = useState([]);

  // Setup tour based on route
  useEffect(() => {
    let steps = [];
    let shouldShow = false;

    if (location.pathname === '/dashboard') {
      if (userProfile && userProfile.has_seen_tutorial === false) {
        steps = getDashboardSteps(userProfile);
        shouldShow = true;
      }
    } else if (location.pathname === '/practice/text') {
      if (!localStorage.getItem('tutorial_text_completed')) {
        steps = TEXT_STEPS;
        shouldShow = true;
      }
    } else if (location.pathname === '/practice/voice') {
      if (!localStorage.getItem('tutorial_voice_completed')) {
        steps = VOICE_STEPS;
        shouldShow = true;
      }
    } else if (location.pathname === '/practice/video') {
      if (!localStorage.getItem('tutorial_video_completed')) {
        steps = getVideoSteps(userProfile);
        shouldShow = true;
      }
    } else if (location.pathname === '/how-to-say') {
      if (!localStorage.getItem('tutorial_howtosay_completed')) {
        steps = getHowToSaySteps(userProfile);
        shouldShow = true;
      }
    }

    if (shouldShow && steps.length > 0) {
      setTourSteps(steps);
      setCurrentStep(0);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [location.pathname, userProfile]);

  const updateSpotlight = useCallback(() => {
    if (tourSteps.length === 0 || !isVisible) return;
    const step = tourSteps[currentStep];
    if (step.targetId) {
      let targetId = step.targetId;
      
      // Adaptation for mobile sidebar
      if (window.innerWidth < 1024 && location.pathname === '/dashboard') {
        if (targetId === "main-sidebar") targetId = "mobile-menu-button";
        if (targetId === "nav-voice") targetId = "module-card-voice";
        if (targetId === "nav-settings") targetId = "mobile-menu-button"; // Point back to menu since there's no settings card
      }

      const el = document.getElementById(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setSpotlightRect(null);
    }
  }, [currentStep, tourSteps, isVisible, location.pathname]);

  useEffect(() => {
    if (isVisible) {
      updateSpotlight();
      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight);
      return () => {
        window.removeEventListener('resize', updateSpotlight);
        window.removeEventListener('scroll', updateSpotlight);
      };
    }
  }, [isVisible, currentStep, updateSpotlight]);

  const closeTutorial = async () => {
    setIsVisible(false);
    if (location.pathname === '/dashboard') {
      try {
        await updateProfile({ has_seen_tutorial: true });
      } catch (err) {
        console.error("Error updating tutorial status:", err);
      }
    } else if (location.pathname === '/practice/text') {
      localStorage.setItem('tutorial_text_completed', 'true');
    } else if (location.pathname === '/practice/voice') {
      localStorage.setItem('tutorial_voice_completed', 'true');
    } else if (location.pathname === '/practice/video') {
      localStorage.setItem('tutorial_video_completed', 'true');
    } else if (location.pathname === '/how-to-say') {
      localStorage.setItem('tutorial_howtosay_completed', 'true');
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      closeTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isVisible || tourSteps.length === 0) return null;

  const stepData = tourSteps[currentStep];

  // Improved positioning logic
  const getCardStyle = () => {
    if (!spotlightRect) return { position: 'relative' };

    const cardWidth = window.innerWidth > 640 ? 360 : window.innerWidth * 0.9;
    const padding = 20;
    
    let left = spotlightRect.left + spotlightRect.width / 2 - cardWidth / 2;
    let top = spotlightRect.top + spotlightRect.height + padding;

    // Boundary checks for horizontal
    left = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, left));

    // Vertical positioning (if it goes off bottom, put it on top of the target)
    if (top + 250 > window.innerHeight) {
      top = spotlightRect.top - 250 - padding;
    }

    // Secondary boundary check for vertical
    top = Math.max(10, Math.min(window.innerHeight - 250 - 10, top));

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${cardWidth}px`,
      maxWidth: '400px'
    };
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
      {/* Invisible Overlay to block clicks */}
      <div className="absolute inset-0 bg-transparent pointer-events-auto">
        <svg className="w-full h-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Animated Glowing Border around Spotlight */}
          {spotlightRect && (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.02, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              x={spotlightRect.left - 10}
              y={spotlightRect.top - 10}
              width={spotlightRect.width + 20}
              height={spotlightRect.height + 20}
              rx="20"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3"
              filter="url(#glow)"
              style={{ transformOrigin: `${spotlightRect.left + spotlightRect.width/2}px ${spotlightRect.top + spotlightRect.height/2}px` }}
            />
          )}
        </svg>
      </div>

      {/* Content Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              ...getCardStyle()
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl p-6 z-[10000]"
          >
            <div className="flex flex-col items-center text-center">
              {!spotlightRect && (
                <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center mb-4">
                  <ShieldCheck size={32} className="text-[#7c3aed]" />
                </div>
              )}
            
            <h3 className="text-xl font-bold text-white mb-2 leading-tight">
              {stepData.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {stepData.description}
            </p>

            <div className="w-full flex items-center justify-between gap-3">
              <button 
                onClick={closeTutorial}
                className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
              >
                Omitir
              </button>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button 
                    onClick={handlePrev}
                    className="p-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all shadow-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="bg-[#7c3aed] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#8b5cf6] transition-all shadow-lg flex items-center gap-2"
                >
                  <span>{currentStep === tourSteps.length - 1 ? 'Empezar' : 'Siguiente'}</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2">
            {tourSteps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-[#7c3aed]' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
