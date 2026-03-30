import { createContext, useContext, useState, useEffect } from 'react';

// Language levels
export const LANGUAGE_LEVELS = {
  beginner: {
    id: 'beginner',
    name: {
      es: 'Principiante',
      en: 'Beginner'
    },
    description: {
      es: 'App en español, prácticas en inglés. Retroalimentación en español con ejemplos en inglés.',
      en: 'App in Spanish, practice in English. Feedback in Spanish with English examples.'
    },
    appLanguage: 'es',
    feedbackLanguage: 'es'
  },
  intermediate: {
    id: 'intermediate',
    name: {
      es: 'Intermedio',
      en: 'Intermediate'
    },
    description: {
      es: 'App en inglés, retroalimentación en español con ejemplos en inglés.',
      en: 'App in English, feedback in Spanish with English examples.'
    },
    appLanguage: 'en',
    feedbackLanguage: 'es'
  },
  advanced: {
    id: 'advanced',
    name: {
      es: 'Avanzado',
      en: 'Advanced'
    },
    description: {
      es: 'Todo en inglés. Inmersión total.',
      en: 'Everything in English. Full immersion.'
    },
    appLanguage: 'en',
    feedbackLanguage: 'en'
  }
};

// Translations
export const translations = {
  // Navigation
  'nav.features': { es: 'Características', en: 'Features' },
  'nav.pricing': { es: 'Precios', en: 'Pricing' },
  'nav.login': { es: 'Iniciar Sesión', en: 'Login' },
  'nav.signup': { es: 'Comenzar Gratis', en: 'Start Free' },
  'nav.logout': { es: 'Cerrar Sesión', en: 'Logout' },
  'nav.dashboard': { es: 'Dashboard', en: 'Dashboard' },
  'nav.writing': { es: 'Escritura', en: 'Writing' },
  'nav.voice': { es: 'Voz', en: 'Voice' },
  'nav.video': { es: 'Video', en: 'Video' },
  
  // Landing page
  'landing.badge': { es: 'Potenciado con IA', en: 'AI Powered' },
  'landing.title1': { es: 'Domina el', en: 'Master' },
  'landing.title2': { es: 'Inglés', en: 'English' },
  'landing.title3': { es: 'para el Trabajo', en: 'for Work' },
  'landing.subtitle': { 
    es: 'La fusión de Work + English. Practica escritura, pronunciación y conversación con IA especializada en contextos laborales.',
    en: 'The fusion of Work + English. Practice writing, pronunciation and conversation with AI specialized in work contexts.'
  },
  'landing.cta': { es: 'Comenzar Gratis', en: 'Start Free' },
  'landing.viewFeatures': { es: 'Ver Características', en: 'View Features' },
  'landing.activeUsers': { es: 'Usuarios activos', en: 'Active users' },
  'landing.improvement': { es: 'Mejora reportada', en: 'Reported improvement' },
  'landing.rating': { es: 'Calificación', en: 'Rating' },
  'landing.problem': {
    es: 'La mayoría de profesionales luchan por aplicar su inglés en el trabajo.',
    en: 'Most professionals struggle to apply their English at work.'
  },
  'landing.solution': {
    es: 'Worklish está aquí para cambiar eso.',
    en: 'Worklish is here to change that.'
  },
  'landing.whyWorklish': { es: '¿Por qué Worklish?', en: 'Why Worklish?' },
  'landing.whySubtitle': {
    es: 'Herramientas diseñadas específicamente para profesionales que quieren destacar en inglés.',
    en: 'Tools specifically designed for professionals who want to excel in English.'
  },
  'landing.howItWorks': { es: 'Cómo Funciona', en: 'How It Works' },
  'landing.pricingTitle': { es: 'Planes y Precios', en: 'Plans & Pricing' },
  'landing.pricingSubtitle': { es: 'Comienza gratis, escala cuando estés listo.', en: 'Start free, scale when ready.' },
  'landing.tryNow': { es: '¡Prueba Worklish Ahora!', en: 'Try Worklish Now!' },
  'landing.trySubtitle': {
    es: 'Haz que aprender inglés para el trabajo sea divertido y eficiente.',
    en: 'Make learning English for work fun and efficient.'
  },
  'landing.startPractice': { es: 'Comienza a practicar gratis', en: 'Start practicing free' },
  
  // Features
  'feature.writing.title': { es: 'Práctica de Escritura', en: 'Writing Practice' },
  'feature.writing.desc': { 
    es: 'Mejora tus emails, reportes y presentaciones con correcciones de IA en tiempo real.',
    en: 'Improve your emails, reports and presentations with real-time AI corrections.'
  },
  'feature.voice.title': { es: 'Entrenamiento de Voz', en: 'Voice Training' },
  'feature.voice.desc': {
    es: 'Perfecciona tu pronunciación con retroalimentación instantánea y tips personalizados.',
    en: 'Perfect your pronunciation with instant feedback and personalized tips.'
  },
  'feature.video.title': { es: 'Video Llamada con IA', en: 'AI Video Call' },
  'feature.video.desc': {
    es: 'Practica conversaciones laborales en tiempo real con un tutor de IA interactivo.',
    en: 'Practice work conversations in real-time with an interactive AI tutor.'
  },
  'feature.focus.title': { es: 'Enfoque Profesional', en: 'Professional Focus' },
  'feature.focus.desc': {
    es: 'Contenido diseñado para situaciones reales del trabajo: reuniones, negociaciones y más.',
    en: 'Content designed for real work situations: meetings, negotiations and more.'
  },
  
  // How it works
  'how.step1.title': { es: 'Elige tu práctica', en: 'Choose your practice' },
  'how.step1.desc': { es: 'Texto, voz o video call según tu objetivo del día.', en: 'Text, voice or video call based on your goal.' },
  'how.step2.title': { es: 'Practica con IA', en: 'Practice with AI' },
  'how.step2.desc': { es: 'Recibe correcciones y tips en tiempo real.', en: 'Get corrections and tips in real-time.' },
  'how.step3.title': { es: 'Mide tu progreso', en: 'Track your progress' },
  'how.step3.desc': { es: 'Visualiza tu mejora con métricas detalladas.', en: 'Visualize your improvement with detailed metrics.' },
  
  // Pricing
  'pricing.free': { es: 'Gratis', en: 'Free' },
  'pricing.forever': { es: 'siempre', en: 'forever' },
  'pricing.month': { es: '/mes', en: '/month' },
  'pricing.popular': { es: 'Más Popular', en: 'Most Popular' },
  'pricing.startFree': { es: 'Comenzar Gratis', en: 'Start Free' },
  'pricing.try7days': { es: 'Probar 7 días gratis', en: 'Try 7 days free' },
  'pricing.contactSales': { es: 'Contactar Ventas', en: 'Contact Sales' },
  
  // Auth page
  'auth.loginTitle': { es: 'Inicia sesión para continuar', en: 'Login to continue' },
  'auth.registerTitle': { es: 'Crea tu cuenta gratuita', en: 'Create your free account' },
  'auth.login': { es: 'Iniciar Sesión', en: 'Login' },
  'auth.register': { es: 'Registrarse', en: 'Register' },
  'auth.name': { es: 'Nombre completo', en: 'Full name' },
  'auth.namePlaceholder': { es: 'Tu nombre', en: 'Your name' },
  'auth.email': { es: 'Correo electrónico', en: 'Email' },
  'auth.password': { es: 'Contraseña', en: 'Password' },
  'auth.forgotPassword': { es: '¿Olvidaste tu contraseña?', en: 'Forgot password?' },
  'auth.createAccount': { es: 'Crear Cuenta', en: 'Create Account' },
  'auth.continueWith': { es: 'o continúa con', en: 'or continue with' },
  'auth.googleSoon': { es: 'Google (Próximamente)', en: 'Google (Coming soon)' },
  'auth.terms': { es: 'Al registrarte, aceptas nuestros', en: 'By signing up, you agree to our' },
  'auth.termsLink': { es: 'Términos', en: 'Terms' },
  'auth.privacyLink': { es: 'Política de Privacidad', en: 'Privacy Policy' },
  'auth.welcomeBack': { es: '¡Bienvenido de vuelta!', en: 'Welcome back!' },
  'auth.accountCreated': { es: '¡Cuenta creada exitosamente!', en: 'Account created successfully!' },
  'auth.backHome': { es: 'Volver al inicio', en: 'Back to home' },
  'auth.selectLevel': { es: 'Selecciona tu nivel', en: 'Select your level' },
  'auth.levelExplain': { es: 'Esto determina el idioma de la app y retroalimentación', en: 'This determines the app and feedback language' },
  
  // Dashboard
  'dashboard.greeting.morning': { es: 'Buenos días', en: 'Good morning' },
  'dashboard.greeting.afternoon': { es: 'Buenas tardes', en: 'Good afternoon' },
  'dashboard.greeting.evening': { es: 'Buenas noches', en: 'Good evening' },
  'dashboard.ready': { es: '¿Listo para mejorar tu inglés hoy?', en: 'Ready to improve your English today?' },
  'dashboard.streak': { es: 'Racha', en: 'Streak' },
  'dashboard.days': { es: 'días', en: 'days' },
  'dashboard.sessions': { es: 'Sesiones', en: 'Sessions' },
  'dashboard.minutes': { es: 'Minutos', en: 'Minutes' },
  'dashboard.min': { es: 'min', en: 'min' },
  'dashboard.average': { es: 'Promedio', en: 'Average' },
  'dashboard.practiceModules': { es: 'Módulos de Práctica', en: 'Practice Modules' },
  'dashboard.writingTitle': { es: 'Práctica de Escritura', en: 'Writing Practice' },
  'dashboard.writingDesc': { es: 'Mejora tus emails y documentos profesionales', en: 'Improve your emails and professional documents' },
  'dashboard.voiceTitle': { es: 'Entrenamiento de Voz', en: 'Voice Training' },
  'dashboard.voiceDesc': { es: 'Perfecciona tu pronunciación', en: 'Perfect your pronunciation' },
  'dashboard.videoTitle': { es: 'Video Llamada IA', en: 'AI Video Call' },
  'dashboard.videoDesc': { es: 'Practica conversaciones en vivo', en: 'Practice live conversations' },
  'dashboard.sessionsCompleted': { es: 'sesiones completadas', en: 'sessions completed' },
  'dashboard.weeklyGoal': { es: 'Meta Semanal', en: 'Weekly Goal' },
  'dashboard.sessionsThisWeek': { es: 'Sesiones esta semana', en: 'Sessions this week' },
  'dashboard.goalReached': { es: '¡Meta alcanzada! Sigue así.', en: 'Goal reached! Keep it up.' },
  'dashboard.sessionsRemaining': { es: 'sesiones para tu meta.', en: 'sessions to your goal.' },
  'dashboard.remaining': { es: 'Faltan', en: 'Remaining' },
  'dashboard.recentActivity': { es: 'Actividad Reciente', en: 'Recent Activity' },
  'dashboard.noActivity': { es: 'Aún no tienes actividad', en: 'No activity yet' },
  'dashboard.startFirst': { es: 'Comienza tu primera práctica', en: 'Start your first practice' },
  'dashboard.streakDays': { es: 'días de racha', en: 'day streak' },
  'dashboard.dailyProgress': { es: 'Progreso diario', en: 'Daily progress' },
  'dashboard.dailyGoal': { es: 'Meta: 5 sesiones diarias', en: 'Goal: 5 daily sessions' },
  
  // Text Practice
  'text.title': { es: 'Práctica de Escritura', en: 'Writing Practice' },
  'text.subtitle': { es: 'Escribe un texto en inglés y recibe correcciones y consejos profesionales.', en: 'Write text in English and get professional corrections and tips.' },
  'text.yourText': { es: 'Tu Texto', en: 'Your Text' },
  'text.writeInEnglish': { es: 'Escribe en inglés', en: 'Write in English' },
  'text.context': { es: 'Contexto', en: 'Context' },
  'text.analyze': { es: 'Analizar Texto', en: 'Analyze Text' },
  'text.analyzing': { es: 'Analizando...', en: 'Analyzing...' },
  'text.grammar': { es: 'Gramática', en: 'Grammar' },
  'text.vocabulary': { es: 'Vocabulario', en: 'Vocabulary' },
  'text.correctedText': { es: 'Texto Corregido', en: 'Corrected Text' },
  'text.tips': { es: 'Consejos', en: 'Tips' },
  'text.waiting': { es: 'Esperando tu texto', en: 'Waiting for your text' },
  'text.waitingDesc': { es: 'Escribe un texto en inglés en el panel izquierdo y presiona "Analizar" para recibir correcciones y consejos.', en: 'Write text in English in the left panel and press "Analyze" to get corrections and tips.' },
  'text.contexts.email': { es: 'Email Profesional', en: 'Professional Email' },
  'text.contexts.report': { es: 'Reporte de Negocios', en: 'Business Report' },
  'text.contexts.presentation': { es: 'Script de Presentación', en: 'Presentation Script' },
  'text.contexts.meeting': { es: 'Notas de Reunión', en: 'Meeting Notes' },
  'text.contexts.job': { es: 'Aplicación de Trabajo', en: 'Job Application' },
  'text.contexts.linkedin': { es: 'Post de LinkedIn', en: 'LinkedIn Post' },
  
  // Voice Practice
  'voice.title': { es: 'Entrenamiento de Voz', en: 'Voice Training' },
  'voice.subtitle': { es: 'Graba tu voz y recibe retroalimentación sobre tu pronunciación.', en: 'Record your voice and get feedback on your pronunciation.' },
  'voice.startRecording': { es: 'Iniciar Grabación', en: 'Start Recording' },
  'voice.stopRecording': { es: 'Detener', en: 'Stop' },
  'voice.recordingReady': { es: 'Grabación lista', en: 'Recording ready' },
  'voice.referenceText': { es: 'Texto de referencia (opcional)', en: 'Reference text (optional)' },
  'voice.referencePlaceholder': { es: 'Escribe el texto que intentas pronunciar para comparar...', en: 'Write the text you\'re trying to pronounce to compare...' },
  'voice.samplePhrases': { es: 'Frases de ejemplo', en: 'Sample phrases' },
  'voice.analyze': { es: 'Analizar Pronunciación', en: 'Analyze Pronunciation' },
  'voice.analyzing': { es: 'Analizando pronunciación...', en: 'Analyzing pronunciation...' },
  'voice.score': { es: 'Puntuación de Pronunciación', en: 'Pronunciation Score' },
  'voice.whatYouSaid': { es: 'Lo que dijiste', en: 'What you said' },
  'voice.feedback': { es: 'Retroalimentación', en: 'Feedback' },
  'voice.tips': { es: 'Consejos', en: 'Tips' },
  'voice.readyToRecord': { es: 'Listo para grabar', en: 'Ready to record' },
  'voice.readyDesc': { es: 'Presiona "Iniciar Grabación" para comenzar. Habla claramente y luego analiza tu pronunciación.', en: 'Press "Start Recording" to begin. Speak clearly and then analyze your pronunciation.' },
  
  // Video Call
  'video.title': { es: 'Video Llamada con IA', en: 'AI Video Call' },
  'video.subtitle': { es: 'Practica conversaciones profesionales en tiempo real.', en: 'Practice professional conversations in real-time.' },
  'video.startSession': { es: 'Inicia una sesión de práctica', en: 'Start a practice session' },
  'video.selectScenario': { es: 'Selecciona un escenario y practica tu inglés con nuestro tutor de IA.', en: 'Select a scenario and practice your English with our AI tutor.' },
  'video.practiceScenario': { es: 'Escenario de práctica', en: 'Practice scenario' },
  'video.startCall': { es: 'Iniciar Llamada', en: 'Start Call' },
  'video.endCall': { es: 'Finalizar', en: 'End Call' },
  'video.inputPlaceholder': { es: 'Escribe tu respuesta en inglés...', en: 'Type your response in English...' },
  'video.corrections': { es: 'Correcciones', en: 'Corrections' },
  'video.tips': { es: 'Consejos', en: 'Tips' },
  'video.scenario': { es: 'Escenario', en: 'Scenario' },
  'video.scenarioTip': { es: 'Tip: Responde como si estuvieras en una situación real. El AI evaluará tu inglés profesional.', en: 'Tip: Respond as if you were in a real situation. The AI will evaluate your professional English.' },
  'video.scenarios.interview': { es: 'Entrevista de Trabajo', en: 'Job Interview' },
  'video.scenarios.salary': { es: 'Negociación Salarial', en: 'Salary Negotiation' },
  'video.scenarios.client': { es: 'Reunión con Cliente', en: 'Client Meeting' },
  'video.scenarios.standup': { es: 'Daily Standup', en: 'Daily Standup' },
  'video.scenarios.presentation': { es: 'Presentación', en: 'Presentation' },
  'video.scenarios.review': { es: 'Evaluación de Desempeño', en: 'Performance Review' },
  
  // Settings
  'settings.title': { es: 'Configuración', en: 'Settings' },
  'settings.subtitle': { es: 'Administra tu cuenta y preferencias.', en: 'Manage your account and preferences.' },
  'settings.profile': { es: 'Perfil', en: 'Profile' },
  'settings.subscription': { es: 'Suscripción', en: 'Subscription' },
  'settings.plan': { es: 'Plan', en: 'Plan' },
  'settings.expires': { es: 'Expira', en: 'Expires' },
  'settings.upgrade': { es: 'Mejorar Plan', en: 'Upgrade Plan' },
  'settings.dataPrivacy': { es: 'Datos y Privacidad', en: 'Data & Privacy' },
  'settings.exportProgress': { es: 'Exportar Progreso', en: 'Export Progress' },
  'settings.exportDesc': { es: 'Descarga tu historial de práctica en formato JSON', en: 'Download your practice history in JSON format' },
  'settings.export': { es: 'Exportar', en: 'Export' },
  'settings.clearProgress': { es: 'Borrar Progreso Local', en: 'Clear Local Progress' },
  'settings.clearDesc': { es: 'Elimina todo tu progreso almacenado localmente', en: 'Delete all your locally stored progress' },
  'settings.clear': { es: 'Borrar', en: 'Clear' },
  'settings.dangerZone': { es: 'Zona de Peligro', en: 'Danger Zone' },
  'settings.deleteAccount': { es: 'Eliminar Cuenta', en: 'Delete Account' },
  'settings.deleteDesc': { es: 'Esta acción eliminará permanentemente tu cuenta', en: 'This action will permanently delete your account' },
  'settings.delete': { es: 'Eliminar', en: 'Delete' },
  'settings.languageLevel': { es: 'Nivel de Idioma', en: 'Language Level' },
  'settings.languageDesc': { es: 'Controla el idioma de la app y retroalimentación', en: 'Control the app and feedback language' },
  'settings.currentLevel': { es: 'Nivel actual', en: 'Current level' },
  'settings.changeLevel': { es: 'Cambiar Nivel', en: 'Change Level' },
  
  // Sidebar
  'sidebar.dashboard': { es: 'Dashboard', en: 'Dashboard' },
  'sidebar.writing': { es: 'Escritura', en: 'Writing' },
  'sidebar.pronunciation': { es: 'Pronunciación', en: 'Pronunciation' },
  'sidebar.videoCall': { es: 'Video Call', en: 'Video Call' },
  'sidebar.settings': { es: 'Configuración', en: 'Settings' },
  'sidebar.logout': { es: 'Cerrar Sesión', en: 'Logout' },
  
  // Common
  'common.and': { es: 'y', en: 'and' },
  'common.or': { es: 'o', en: 'or' },
  'common.loading': { es: 'Cargando...', en: 'Loading...' },
  'common.error': { es: 'Error', en: 'Error' },
  'common.success': { es: 'Éxito', en: 'Success' },
  'common.cancel': { es: 'Cancelar', en: 'Cancel' },
  'common.save': { es: 'Guardar', en: 'Save' },
  'common.confirm': { es: 'Confirmar', en: 'Confirm' },
};

// Context
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('worklish_language_level');
    return saved || 'beginner';
  });

  const [overrideLang, setOverrideLang] = useState(null);

  const currentLevel = LANGUAGE_LEVELS[level];
  const defaultAppLang = currentLevel?.appLanguage || 'es';
  const appLang = overrideLang || defaultAppLang;
  const feedbackLang = currentLevel?.feedbackLanguage || 'es';

  useEffect(() => {
    localStorage.setItem('worklish_language_level', level);
  }, [level]);

  // Translation function
  const t = (key) => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[appLang] || translation['es'] || key;
  };

  // Get feedback language for API calls
  const getFeedbackLanguage = () => feedbackLang;

  const value = {
    level,
    setLevel,
    currentLevel,
    appLang,
    overrideLang,
    setOverrideLang,
    feedbackLang,
    t,
    getFeedbackLanguage,
    LANGUAGE_LEVELS
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
