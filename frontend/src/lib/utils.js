import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Progress helpers (stored locally)
export const getProgress = () => {
  const progress = localStorage.getItem('worklish_progress');
  return progress ? JSON.parse(progress) : {
    textSessions: 0,
    voiceSessions: 0,
    videoSessions: 0,
    totalMinutes: 0,
    averageScore: 0,
    streak: 0,
    lastPractice: null,
    history: []
  };
};

export const updateProgress = (type, score) => {
  const progress = getProgress();
  const now = new Date().toISOString();
  
  progress[`${type}Sessions`] = (progress[`${type}Sessions`] || 0) + 1;
  progress.totalMinutes = (progress.totalMinutes || 0) + 5;
  
  const totalSessions = progress.textSessions + progress.voiceSessions + progress.videoSessions;
  progress.averageScore = Math.round(
    ((progress.averageScore * (totalSessions - 1)) + score) / totalSessions
  );
  
  const lastPractice = progress.lastPractice ? new Date(progress.lastPractice) : null;
  const today = new Date();
  if (lastPractice) {
    const diffDays = Math.floor((today - lastPractice) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      progress.streak = (progress.streak || 0) + 1;
    } else if (diffDays > 1) {
      progress.streak = 1;
    }
  } else {
    progress.streak = 1;
  }
  
  progress.lastPractice = now;
  
  progress.history = [
    { type, score, date: now },
    ...(progress.history || []).slice(0, 49)
  ];
  
  localStorage.setItem('worklish_progress', JSON.stringify(progress));
  return progress;
};

export const getDailyCount = (type) => {
  const progress = getProgress();
  const today = new Date().toISOString().split('T')[0];
  
  return (progress.history || []).filter(item => {
    return item.type === type && item.date.startsWith(today);
  }).length;
};

export const canPractice = (type, userProfile) => {
  if (!userProfile) return true; // Default to allow if profile not loaded
  
  const status = userProfile?.subscription_status || 'free';
  if (status === 'enterprise') return true;
  
  const progress = getProgress();
  
  if (status === 'pro') {
    // If Pro, limit total minutes (this could be per month, but for simplicity we use totalMinutes here)
    // Or we filter history for current month
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyMinutes = (progress.history || [])
      .filter(item => item.date.startsWith(thisMonth))
      .reduce((acc, item) => acc + (item.type === 'video' ? 5 : 0), 0); // Assuming 5 min per session for simplicity
      
    if (type === 'video' && monthlyMinutes >= 30) return false;
    return true;
  }
  
  // Free plan limits
  const dailyCount = getDailyCount(type);
  if (type === 'text' && dailyCount >= 5) return false;
  if (type === 'voice' && dailyCount >= 2) return false;
  if (type === 'video') return false; // Free can't do video
  
  return true;
};
