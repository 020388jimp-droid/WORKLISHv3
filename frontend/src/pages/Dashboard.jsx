import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PenTool, 
  Mic, 
  Video, 
  Flame, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Sidebar } from '../components/Sidebar';
import { getProgress } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, isAuthenticated } = useAuth();
  const progress = getProgress();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, [navigate, isAuthenticated]);

  const practiceModules = [
    {
      id: 'text',
      title: 'Práctica de Escritura',
      description: 'Mejora tus emails y documentos profesionales',
      icon: PenTool,
      color: '#7c3aed',
      path: '/practice/text',
      sessions: progress.textSessions || 0
    },
    {
      id: 'voice',
      title: 'Entrenamiento de Voz',
      description: 'Perfecciona tu pronunciación',
      icon: Mic,
      color: '#06b6d4',
      path: '/practice/voice',
      sessions: progress.voiceSessions || 0
    },
    {
      id: 'video',
      title: 'Video Llamada IA',
      description: 'Practica conversaciones en vivo',
      icon: Video,
      color: '#10b981',
      path: '/practice/video',
      sessions: progress.videoSessions || 0
    }
  ];

  const stats = [
    { label: 'Racha', value: progress.streak || 0, suffix: ' días', icon: Flame, color: '#f59e0b' },
    { label: 'Sesiones', value: progress.textSessions + progress.voiceSessions + progress.videoSessions, suffix: '', icon: Target, color: '#7c3aed' },
    { label: 'Minutos', value: progress.totalMinutes || 0, suffix: ' min', icon: Clock, color: '#06b6d4' },
    { label: 'Promedio', value: progress.averageScore || 0, suffix: '%', icon: TrendingUp, color: '#10b981' }
  ];

  const recentHistory = (progress.history || []).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 
            data-testid="dashboard-greeting"
            className="text-3xl font-bold font-['Outfit'] text-white mb-2"
          >
            {greeting}, {userProfile?.name?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="text-slate-400">
            ¿Listo para mejorar tu inglés hoy?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                data-testid={`stat-${stat.label.toLowerCase()}`}
                className="bg-[#1a1a2e] border-white/5 p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <span className="text-slate-400 text-sm">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stat.value}<span className="text-lg text-slate-400">{stat.suffix}</span>
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Practice Modules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4 font-['Outfit']">
            Módulos de Práctica
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {practiceModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Link to={module.path}>
                  <Card 
                    data-testid={`module-${module.id}`}
                    className="bg-[#1a1a2e] border-white/5 p-6 h-full hover:border-[#7c3aed]/30 transition-all group cursor-pointer"
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${module.color}20` }}
                    >
                      <module.icon size={28} style={{ color: module.color }} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{module.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {module.sessions} sesiones completadas
                      </span>
                      <ArrowRight size={18} className="text-slate-500 group-hover:text-[#7c3aed] group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Goal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card 
              data-testid="weekly-goal"
              className="bg-[#1a1a2e] border-white/5 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white font-['Outfit']">Meta Semanal</h3>
                <Award className="text-[#7c3aed]" size={24} />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Sesiones esta semana</span>
                    <span className="text-white font-medium">
                      {progress.textSessions + progress.voiceSessions + progress.videoSessions}/20
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, ((progress.textSessions + progress.voiceSessions + progress.videoSessions) / 20) * 100)} 
                    className="h-3 bg-white/10"
                  />
                </div>
                <p className="text-sm text-slate-400">
                  {progress.textSessions + progress.voiceSessions + progress.videoSessions >= 20 
                    ? '¡Meta alcanzada! Sigue así.' 
                    : `Faltan ${20 - (progress.textSessions + progress.voiceSessions + progress.videoSessions)} sesiones para tu meta.`}
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card 
              data-testid="recent-activity"
              className="bg-[#1a1a2e] border-white/5 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white font-['Outfit']">Actividad Reciente</h3>
                <Calendar className="text-[#06b6d4]" size={24} />
              </div>
              {recentHistory.length > 0 ? (
                <div className="space-y-3">
                  {recentHistory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.type === 'text' ? 'bg-[#7c3aed]/20' :
                          item.type === 'voice' ? 'bg-[#06b6d4]/20' : 'bg-[#10b981]/20'
                        }`}>
                          {item.type === 'text' && <PenTool size={14} className="text-[#7c3aed]" />}
                          {item.type === 'voice' && <Mic size={14} className="text-[#06b6d4]" />}
                          {item.type === 'video' && <Video size={14} className="text-[#10b981]" />}
                        </div>
                        <div>
                          <p className="text-sm text-white capitalize">
                            {item.type === 'text' ? 'Escritura' : 
                             item.type === 'voice' ? 'Voz' : 'Video'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(item.date).toLocaleDateString('es-ES', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${
                        item.score >= 80 ? 'text-[#10b981]' : 
                        item.score >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                      }`}>
                        {item.score}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">Aún no tienes actividad</p>
                  <Link to="/practice/text">
                    <Button className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full">
                      Comienza tu primera práctica
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
