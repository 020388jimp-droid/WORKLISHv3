// frontend/src/contexts/AuthContext.jsx
// Contexto de autenticación con Firebase

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db,
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  logout as firebaseLogout,
  deleteUserAccount 
} from '../lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { RevenueCatService } from '../lib/revenuecat';

const AuthContext = createContext();

// Lista de correos con acceso Enterprise de por vida (Administradores/Desarrolladores)
const ADMIN_EMAILS = [
  'admin@worklish.com',
  '020388jimp@gmail.com',
  // Agrega tu correo aquí
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Inicializar RevenueCat para este usuario si estamos en móvil
        if (Capacitor.isNativePlatform()) {
          RevenueCatService.initialize(firebaseUser.uid);
        }
        
        // Cargar perfil de Firestore
        try {
          const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
          
            if (profileDoc.exists()) {
              let data = profileDoc.data();
              
              // Verificar si el trial ya expiró
              if (data.subscription_status === 'trial' && data.subscription_end) {
                const now = new Date();
                const end = new Date(data.subscription_end);
                if (now > end) {
                  data.subscription_status = 'free';
                  data.subscription_end = null;
                  await setDoc(doc(db, 'users', firebaseUser.uid), {
                    subscription_status: 'free',
                    subscription_end: null
                  }, { merge: true });
                }
              }

              // Bypass para administradores
              if (isAdmin && data.subscription_status !== 'enterprise') {
                data.subscription_status = 'enterprise';
                data.subscription_end = 'lifetime';
                await setDoc(doc(db, 'users', firebaseUser.uid), data, { merge: true });
              }
              
              // Sanitizar nombre: si está vacío o es "Usuario", forzar el nombre real
              const finalName = (data.name && data.name !== 'Usuario') ? data.name : (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario');
              
              setUserProfile({ id: firebaseUser.uid, ...data, name: finalName });
              
              // Auto-corregir en base de datos si estaba corrupto
              if (data.name !== finalName) {
                setDoc(doc(db, 'users', firebaseUser.uid), { name: finalName }, { merge: true }).catch(() => {});
              }
            } else {
            // Crear perfil si no existe
            const newProfile = {
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
              subscription_status: isAdmin ? 'enterprise' : 'trial',
              subscription_end: isAdmin ? 'lifetime' : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              language_level: 'beginner',
              has_seen_tutorial: false,
              created_at: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile({ id: firebaseUser.uid, ...newProfile });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
          // Usar datos básicos del usuario de Firebase Auth
          setUserProfile({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            subscription_status: isAdmin ? 'enterprise' : 'trial',
            subscription_end: isAdmin ? 'lifetime' : null
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
      const firebaseUser = await loginWithEmail(email, password);
      setUser(firebaseUser); // Forzar actualización de la sesión
      
      // Forzar carga fresca del perfil de Firestore tras el login
      const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        // Si por alguna razón el nombre quedó como "Usuario" en caché, forzamos usar el nombre real de Auth
        const finalName = (data.name && data.name !== 'Usuario') ? data.name : (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario');
        
        setUserProfile({ id: firebaseUser.uid, ...data, name: finalName });
        
        // Corregimos la base de datos si estaba mal
        if (data.name !== finalName) {
          setDoc(doc(db, 'users', firebaseUser.uid), { name: finalName }, { merge: true }).catch(() => {});
        }
      } else {
        setUserProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          subscription_status: isAdmin ? 'enterprise' : 'trial',
          subscription_end: isAdmin ? 'lifetime' : null
        });
      }
      
      return firebaseUser;
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
      let user;
      if (Capacitor.isNativePlatform()) {
        // --- NATIVE LOGIN (APK) ---
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        
        try { await GoogleAuth.initialize(); } catch(e) {}

        const userResult = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(userResult.authentication.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const usedTrialDoc = await getDoc(doc(db, "used_trials", user.email));
          const hasUsedTrial = usedTrialDoc.exists();

          const newProfile = {
            email: user.email,
            name: user.displayName || user.email?.split("@")[0] || 'Usuario',
            subscription_status: "free",
            subscription_end: null,
            language_level: "beginner",
            preferred_voice: "orion",
            created_at: new Date().toISOString(),
            has_seen_tutorial: false
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile({ id: user.uid, ...newProfile });
          
          try {
            await setDoc(doc(db, 'stats', 'global'), {
              total_users: increment(1)
            }, { merge: true });
          } catch(e) {}
        } else {
          setUserProfile({ id: user.uid, ...userDoc.data() });
        }
      } else {
        // --- WEB LOGIN ---
        user = await loginWithGoogle();
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile({ id: user.uid, ...userDoc.data() });
        }
      }
      return user;
    } catch (err) {
      console.error("Google Login Error:", err);
      throw err;
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

  const deleteAccount = async () => {
    if (!user) return;
    const uid = user.uid;
    const email = user.email;
    try {
      // Record the used trial to prevent abuse
      if (email && userProfile?.subscription_status === 'trial') {
        await setDoc(doc(db, 'used_trials', email), {
          deleted_at: new Date().toISOString(),
          reason: 'account_deleted_during_trial'
        });
      }

      // 1. Borrar documento físico en Firestore
      await deleteDoc(doc(db, 'users', uid));
      // 2. Borrar de Firebase Auth
      await deleteUserAccount();
      
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error deleting account:', error);
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
    deleteAccount,
    isAuthenticated: !!user && !!userProfile && (user.providerData[0]?.providerId !== 'password' || user.emailVerified)
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
