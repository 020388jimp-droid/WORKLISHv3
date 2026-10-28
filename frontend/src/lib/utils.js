import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Progress helpers (Now syncing with Firebase userProfile)
export const getProgress = (userProfile = null) => {
  if (userProfile && userProfile.progress) {
    return userProfile.progress;
  }
  
  return {
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

export const updateProgress = (type, score, userProfile, updateProfileFn) => {
  const progress = getProgress(userProfile);
  const now = new Date().toISOString();
  
  // Clone progress to avoid mutating state directly
  const p = { ...progress };
  
  p[`${type}Sessions`] = (p[`${type}Sessions`] || 0) + 1;
  p.totalMinutes = (p.totalMinutes || 0) + 5;
  
  const totalSessions = (p.textSessions || 0) + (p.voiceSessions || 0) + (p.videoSessions || 0) + (p.howToSaySessions || 0);
  p.averageScore = Math.round(
    ((p.averageScore * (totalSessions - 1)) + score) / totalSessions
  ) || score;
  
  const todayStr = new Date(now).toDateString();
  
  if (p.lastPractice) {
    const lastDate = new Date(p.lastPractice).toDateString();
    
    if (lastDate !== todayStr) {
       // A new day! Calculate calendar difference
       const last = new Date(lastDate);
       const today = new Date(todayStr);
       const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
       
       if (diffDays === 1) {
         p.streak = (p.streak || 0) + 1;
       } else if (diffDays > 1) {
         p.streak = 1; // Streak broken
       }
    }
    // If lastDate === todayStr, streak remains the same (already practiced today)
  } else {
    p.streak = 1;
  }
  
  p.lastPractice = now;
  
  p.history = [
    { type, score, date: now },
    ...(p.history || []).slice(0, 49)
  ];
  
  // Sync to Firebase if available
  if (updateProfileFn) {
    updateProfileFn({ progress: p }).catch(e => console.error("Firebase progress sync failed:", e));
  }
  
  return p;
};

export const getDailyCount = (type, userProfile) => {
  const progress = getProgress(userProfile);
  const today = new Date().toISOString().split('T')[0];
  
  return (progress.history || []).filter(item => {
    return item.type === type && item.date.startsWith(today);
  }).length;
};

export const canPractice = (type, userProfile) => {
  if (!userProfile) return true; // Default to allow if profile not loaded
  
  const status = userProfile?.subscription_status || 'free';
  const progress = getProgress(userProfile);
  
  // Enterprise: Ilimitado todo
  if (status === 'enterprise') return true;
  
  // Pro plan limits
  if (status === 'pro') {
    if (type === 'video') {
      const dailyVideoCount = getDailyCount('video', userProfile);
      if (dailyVideoCount >= 1) return false; // 1 sesión de 5 min cada 24h
    }
    return true;
  }
  
  // Trial plan limits
  if (status === 'trial') {
    if (type === 'video') {
      const dailyVideoCount = getDailyCount('video', userProfile);
      if (dailyVideoCount >= 1) return false; // 1 sesión de 5 min en el trial
    }
    return true;
  }

  // Free plan limits
  const dailyCount = getDailyCount(type, userProfile);
  if (type === 'text' && dailyCount >= 5) return false;
  if (type === 'voice' && dailyCount >= 2) return false;
  if (type === 'video') return false; 
  
  return true;
};

export const getTrialDaysLeft = (userProfile) => {
  if (!userProfile || userProfile.subscription_status !== 'trial' || !userProfile.subscription_end) {
    return null;
  }
  const now = new Date();
  const end = new Date(userProfile.subscription_end);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
