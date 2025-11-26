import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import type { User, UserCredential } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthAction, setIsAuthAction] = useState(false);

  useEffect(() => {
    // Set persistence to session (will clear on tab close)
    // Comment this line if you want tokens to persist across browser restarts
    setPersistence(auth, browserSessionPersistence).catch((error) => {
      console.error('Failed to set persistence:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Don't check token during active auth actions (sign-in/sign-up)
      if (!isAuthAction && user) {
        const storedToken = localStorage.getItem('authToken');
        
        // If user exists in Firebase but no token in localStorage, sign out
        // This allows manual token deletion from console to log user out
        if (!storedToken) {
          console.log('Token removed manually, signing out...');
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      
      setUser(user);
      
      // Store JWT token in localStorage when user signs in
      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [isAuthAction]);

  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setIsAuthAction(true);
      
      // Set persistence before sign up (session-only)
      await setPersistence(auth, browserSessionPersistence);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification with continue URL
      const continueUrl = window.location.origin; // https://planer.moldahasank.workers.dev
      await sendEmailVerification(result.user, {
        url: continueUrl,
        handleCodeInApp: false,
      });
      
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);
      return result;
    } finally {
      setIsAuthAction(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setIsAuthAction(true);
      
      // Set persistence before sign in (session-only)
      await setPersistence(auth, browserSessionPersistence);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);
      return result;
    } finally {
      setIsAuthAction(false);
    }
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem('authToken');
    await signOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (user) {
      return await user.getIdToken();
    }
    return null;
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (user && !user.emailVerified) {
      const continueUrl = window.location.origin; // https://planer.moldahasank.workers.dev
      await sendEmailVerification(user, {
        url: continueUrl,
        handleCodeInApp: false,
      });
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const continueUrl = window.location.origin;
    await sendPasswordResetEmail(auth, email, {
      url: continueUrl,
      handleCodeInApp: false,
    });
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    getIdToken,
    resendVerificationEmail,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

