// frontend/src/contexts/AuthContext.jsx
// Contexto de autenticación con Firebase

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db,
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  logout as firebaseLogout
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Cargar perfil de Firestore
        try {
          const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (profileDoc.exists()) {
            setUserProfile({ id: firebaseUser.uid, ...profileDoc.data() });
          } else {
            // Crear perfil si no existe
            const newProfile = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
              subscription_status: 'trial',
              subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              language_level: 'beginner',
              created_at: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile({ id: firebaseUser.uid, ...newProfile });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Usar datos básicos del usuario de Firebase Auth
          setUserProfile({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            subscription_status: 'trial'
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setLoading(true);
    try {
      const user = await registerWithEmail(email, password, name);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    setUserProfile(null);
  };

  const updateProfile = async (data) => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      setUserProfile(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
