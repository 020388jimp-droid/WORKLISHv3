import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0f0f1a] noise">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto bg-[#1a1a2e] border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-2xl">
          <Link to={-1} className="inline-flex items-center text-[#7c3aed] hover:text-[#8b5cf6] mb-8 font-medium transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Volver
          </Link>

          <h1 className="text-4xl font-bold font-['Outfit'] text-white mb-2">Política de Privacidad</h1>
          <p className="text-slate-400 mb-10 text-sm">Última actualización: 17 de Abril de 2026</p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Información que recopilamos</h2>
              <p>Worklish recopila información necesaria para proveer el servicio de tutoría de idiomas, incluyendo:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong className="text-white">Datos de cuenta:</strong> Correo electrónico y nombre para gestionar tu acceso y progreso.</li>
                <li><strong className="text-white">Audios (Micrófono):</strong> Las grabaciones de voz se procesan temporalmente para analizar la pronunciación mediante inteligencia artificial. Los archivos de audio no se almacenan permanentemente ni se utilizan para entrenar modelos públicos.</li>
                <li><strong className="text-white">Datos de uso:</strong> Textos escritos en la aplicación y métricas de progreso (rachas, puntuaciones) para personalizar tu experiencia.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Cómo usamos tu información</h2>
              <p>Utilizamos la información recopilada exclusivamente para:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Proporcionar retroalimentación en tiempo real de tu escritura y pronunciación.</li>
                <li>Llevar un registro de tu progreso a través del tiempo.</li>
                <li>Gestionar suscripciones y dar soporte al usuario.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Terceros y Servicios Conectados</h2>
              <p>Worklish utiliza servicios de terceros altamente seguros para procesar datos:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong className="text-white">Google Cloud / Firebase:</strong> Para la base de datos segura y la autenticación.</li>
                <li><strong className="text-white">Google Generative AI (Gemini):</strong> Para el análisis lingüístico en tiempo real.</li>
                <li><strong className="text-white">RevenueCat / Stripe:</strong> Para procesar pagos y suscripciones con alta seguridad bancaria. Nosotros no almacenamos números completos de tarjetas de crédito.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Retención y Eliminación de Datos</h2>
              <p>Puedes solicitar la eliminación permanente de todos tus datos, progreso y perfil en cualquier momento desde la sección de Configuración ("Eliminar cuenta") dentro de la aplicación.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Permisos Móviles requeridos</h2>
              <p>La aplicación móvil (Android/iOS) solicitará permiso para:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong className="text-white">Grabación de Audio (Micrófono):</strong> Esencial para evaluar la parte oral.</li>
                <li><strong className="text-white">Acceso a red:</strong> Para conectar con los servicios de inteligencia artificial.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Contacto</h2>
              <p>Si tienes cualquier duda sobre tu privacidad o el manejo de tus datos, puedes enviarnos un correo a: <strong>020388jimp@gmail.com</strong></p>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-white/5 text-center mt-auto">
        <span className="text-xl font-bold font-['Outfit'] text-white">
          Work<span className="text-[#7c3aed]">lish</span>
        </span>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
