import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// API helper
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_URL = `${BACKEND_URL}/api`;

// Auth helpers
export const getToken = () => localStorage.getItem('worklish_token');
export const setToken = (token) => localStorage.setItem('worklish_token', token);
export const removeToken = () => localStorage.removeItem('worklish_token');

export const getUser = () => {
  const user = localStorage.getItem('worklish_user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('worklish_user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('worklish_user');

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
  
  // Update average score
  const totalSessions = progress.textSessions + progress.voiceSessions + progress.videoSessions;
  progress.averageScore = Math.round(
    ((progress.averageScore * (totalSessions - 1)) + score) / totalSessions
  );
  
  // Update streak
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
  
  // Add to history (keep last 50)
  progress.history = [
    { type, score, date: now },
    ...(progress.history || []).slice(0, 49)
  ];
  
  localStorage.setItem('worklish_progress', JSON.stringify(progress));
  return progress;
};

// API request helper with auth
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  
  return response.json();
};
