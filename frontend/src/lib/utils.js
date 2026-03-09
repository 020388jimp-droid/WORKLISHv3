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
