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
  Calendar,
  Crown,
  Languages
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { getProgress } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const progress = getProgress(userProfile);
  const [greeting, setGreeting] = useState('');
  const [calendarMode, setCalendarMode] = useState('week'); // 'week' | 'month'
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('dashboard.greeting.morning'));
    else if (hour < 18) setGreeting(t('dashboard.greeting.afternoon'));
    else setGreeting(t('dashboard.greeting.evening'));
  }, [navigate, isAuthenticated, t]);
  const practiceModules = [
    {
      id: 'how-to-say',
      title: t('dashboard.howToSayTitle'),
      description: t('dashboard.howToSayDesc'),
      icon: Languages,
      color: '#f59e0b',
      path: '/how-to-say',
      sessions: progress.howToSaySessions || 0
    },
    {
      id: 'text',
      title: t('dashboard.writingTitle'),
      description: t('dashboard.writingDesc'),
      icon: PenTool,
      color: '#7c3aed',
      path: '/practice/text',
      sessions: progress.textSessions || 0
    },
    {
      id: 'voice',
      title: t('dashboard.voiceTitle'),
      description: t('dashboard.voiceDesc'),
      icon: Mic,
      color: '#06b6d4',
      path: '/practice/voice',
      sessions: progress.voiceSessions || 0
    },
    {
      id: 'video',
      title: t('dashboard.videoTitle'),
      description: t('dashboard.videoDesc'),
      icon: Video,
      color: '#10b981',
      path: '/practice/video',
      sessions: progress.videoSessions || 0
    },
  ];

  const filteredModules = practiceModules.filter(module => {
    if (module.id === 'video' && userProfile?.subscription_status === 'free') return false;
    return true;
  });

  const stats = [
    { label: t('dashboard.streak'), value: progress.streak || 0, suffix: ` ${t('dashboard.days')}`, icon: Flame, color: '#f59e0b' },
    { label: t('dashboard.sessions'), value: (progress.textSessions || 0) + (progress.voiceSessions || 0) + (progress.videoSessions || 0) + (progress.howToSaySessions || 0), suffix: '', icon: Target, color: '#7c3aed' },
    { label: t('dashboard.minutes'), value: progress.totalMinutes || 0, suffix: ` ${t('dashboard.min')}`, icon: Clock, color: '#06b6d4' },
    { label: t('dashboard.average'), value: progress.averageScore || 0, suffix: '%', icon: TrendingUp, color: '#10b981' }
  ];

  const recentHistory = (progress.history || []).slice(0, 5);

  return (
    <>
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
          {t('dashboard.ready')}
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
              id={`stat-card-${index}`}
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
          {t('dashboard.practiceModules')}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Link to={module.path}>
                <Card 
                  id={`module-card-${module.id}`}
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
                      {module.sessions} {t('dashboard.sessionsCompleted')}
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
        {/* Activity Calendar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card 
            id="activity-calendar"
            className="bg-[#1a1a2e] border-white/5 p-6 h-full flex flex-col"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-[#06b6d4]" size={24} />
                <h3 className="text-lg font-semibold text-white font-['Outfit']">Actividad</h3>
              </div>
              <div className="flex items-center bg-white/5 rounded-full p-1">
                <button
                  onClick={() => setCalendarMode('week')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${calendarMode === 'week' ? 'bg-[#7c3aed] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setCalendarMode('month')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${calendarMode === 'month' ? 'bg-[#7c3aed] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  Mes
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-black/20 rounded-xl p-4 border border-white/5">
              {(() => {
                const history = progress.history || [];
                const counts = {};
                history.forEach(item => {
                  const d = new Date(item.date).toISOString().split('T')[0];
                  counts[d] = (counts[d] || 0) + 1;
                });

                if (calendarMode === 'week') {
                  const today = new Date();
                  const days = [];
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    days.push(d);
                  }
                  
                  return (
                    <div className="flex justify-between items-end h-full pt-4">
                      {days.map((date, i) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const count = counts[dateStr] || 0;
                        const height = count === 0 ? '4px' : `${Math.min(100, Math.max(15, count * 15))}%`;
                        return (
                          <div key={i} className="flex flex-col items-center gap-3 w-8">
                            <span className="text-xs font-bold text-[#06b6d4]">{count > 0 ? count : ''}</span>
                            <div className="w-full h-24 bg-white/5 rounded-full relative flex items-end justify-center overflow-hidden">
                              <div 
                                className="w-full bg-[#7c3aed] rounded-full transition-all duration-500"
                                style={{ height }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${count > 0 ? 'text-white' : 'text-slate-500'}`}>
                              {date.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  // Month Mode
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = today.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const days = Array.from({ length: daysInMonth }, (_, i) => {
                    const d = new Date(year, month, i + 1);
                    return {
                      date: d,
                      str: d.toISOString().split('T')[0],
                      count: counts[d.toISOString().split('T')[0]] || 0
                    };
                  });
                  
                  return (
                    <div className="grid grid-cols-7 gap-2">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                        <div key={i} className="text-center text-[10px] text-slate-500 font-bold mb-2">{d}</div>
                      ))}
                      {/* Offset for first day */}
                      {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {days.map((day, i) => (
                        <div 
                          key={i} 
                          className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium
                            ${day.count === 0 ? 'bg-white/5 text-slate-600' : 
                              day.count < 3 ? 'bg-[#7c3aed]/40 text-white' : 
                              'bg-[#7c3aed] text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]'
                            }
                          `}
                          title={`${day.count} lecciones`}
                        >
                          {day.date.getDate()}
                        </div>
                      ))}
                    </div>
                  );
                }
              })()}
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
              <h3 className="text-lg font-semibold text-white font-['Outfit']">{t('dashboard.recentActivity')}</h3>
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
                          {item.type === 'text' ? t('dashboard.writingTitle') : 
                           item.type === 'voice' ? t('dashboard.voiceTitle') : t('dashboard.videoTitle')}
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
                <p className="text-slate-400 mb-4">{t('dashboard.noActivity')}</p>
                <Link to="/practice/text">
                  <Button className="bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full">
                    {t('dashboard.startFirst')}
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;
