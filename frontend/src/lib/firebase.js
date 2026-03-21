// frontend/src/lib/firebase.js
// Configuración de Firebase para WORKLISH

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';

// ===============================
// CONFIG FIREBASE
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyBMxJJr7p5CV6zYNIql-LGqj1DOdpsT5GE",
  authDomain: "worklish-app-v2.firebaseapp.com",
  projectId: "worklish-app-v2",
  storageBucket: "worklish-app-v2.firebasestorage.app",
  messagingSenderId: "697729647513",
  appId: "1:697729647513:web:cabd609f9bd6cfb8050908"
};

// ===============================
// INICIALIZAR FIREBASE
// ===============================

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// 🔴 IMPORTANTE
// Conectar a la base "worklish"
export const db = getFirestore(app, "worklish");

export const googleProvider = new GoogleAuthProvider();

// ===============================
// CLOUD FUNCTIONS URL
// ===============================

const FUNCTIONS_BASE_URL =
  process.env.REACT_APP_FUNCTIONS_URL ||
  "https://us-central1-worklish-app-v2.cloudfunctions.net";

// ===============================
// AUTH FUNCTIONS
// ===============================

export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const registerWithEmail = async (email, password, name) => {

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    name: name,
    subscription_status: "trial",
    subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    language_level: "beginner",
    preferred_voice: "orion",
    created_at: new Date().toISOString()
  });

  return user;
};

export const loginWithGoogle = async () => {

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {

    await setDoc(userDocRef, {
      email: user.email,
      name: user.displayName || user.email?.split("@")[0],
      subscription_status: "trial",
      subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      language_level: "beginner",
      preferred_voice: "orion",
      created_at: new Date().toISOString()
    });

  }

  return user;
};

export const logout = () => signOut(auth);

export const getCurrentUser = () => {

  return new Promise((resolve, reject) => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );

  });

};

// ===============================
// API REQUEST HELPER
// ===============================

const getAuthToken = async () => {

  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user");
  }

  return user.getIdToken();

};

export const apiRequest = async (endpoint, options = {}) => {

  const token = await getAuthToken();

  const url = `${FUNCTIONS_BASE_URL}/${endpoint}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;

};

// ===============================
// PRACTICE API
// ===============================

export const practiceText = async (text, context, feedbackLanguage) => {

  return apiRequest("practiceText", {
    method: "POST",
    body: JSON.stringify({
      text,
      context,
      feedback_language: feedbackLanguage
    })
  });

};

export const practiceVoice = async (audioBlob, expectedText, context, feedbackLanguage = 'es') => {

  const token = await getAuthToken();

  const formData = new FormData();

  formData.append("audio_file", audioBlob, "recording.webm");

  if (expectedText) formData.append("expected_text", expectedText);

  formData.append("context", context || "business conversation");
  formData.append("feedback_language", feedbackLanguage);

  const response = await fetch(`${FUNCTIONS_BASE_URL}/practiceVoice`, {

    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Voice practice failed");
  }

  return data;

};

export const videoCall = async (userMessage, conversationHistory, scenario, feedbackLanguage) => {

  return apiRequest("videoCall", {
    method: "POST",
    body: JSON.stringify({
      user_message: userMessage,
      conversation_history: conversationHistory,
      scenario,
      feedback_language: feedbackLanguage
    })
  });

};

export const getUserProfile = async () => {
  return apiRequest("getUserProfile", { method: "GET" });
};

export const updateUserProfile = async (data) => {

  return apiRequest("updateUserProfile", {
    method: "POST",
    body: JSON.stringify(data)
  });

};

export const getPracticeHistory = async (limit = 20, type = null) => {

  let url = `getPracticeHistory?limit=${limit}`;

  if (type) url += `&type=${type}`;

  return apiRequest(url, { method: "GET" });

};

export const updateSubscription = async (plan) => {

  return apiRequest("updateSubscription", {
    method: "POST",
    body: JSON.stringify({ plan })
  });

};

export const generateSpeech = async (text, voiceId) => {
  return apiRequest("generateSpeech", {
    method: "POST",
    body: JSON.stringify({ text, voiceId })
  });
};

export default app;