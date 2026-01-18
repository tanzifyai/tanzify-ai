import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { db } from '@/lib/supabase';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Fallback or disable auth
}

interface User {
  id: string;
  email: string;
  name: string;
  credits: number; // in minutes
  minutes_used: number;
  subscription?: string;
  stripeCustomerId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Fetch additional user data from Supabase
            const userData = await fetchUserData(firebaseUser.uid);
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (uid: string): Promise<User> => {
    try {
      const userData = await db.getUser(uid);
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        credits: userData.credits,
        minutes_used: userData.minutes_used || 0,
        subscription: userData.subscription_plan,
        stripeCustomerId: userData.stripe_customer_id,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to Firebase data if Supabase fails
      const firebaseUser = auth.currentUser;
      return {
        id: uid,
        email: firebaseUser?.email || '',
        name: firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'User',
        credits: 30,
        minutes_used: 0,
      };
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      // Create user profile in Supabase
      await db.createUser({
        firebase_uid: userCredential.user.uid,
        email,
        name,
        credits: 10, // Free credits for new users
        minutes_used: 0,
      });

      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (auth) signOut(auth);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};