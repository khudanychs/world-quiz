import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User as FirebaseUser // Rename to avoid conflict if any
} from 'firebase/auth';
import { auth } from '../firebase';

// A custom User type to combine Firebase User and our custom fields if needed
// For now, it will mostly mirror FirebaseUser's relevant fields
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setNickname: (username: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const formattedUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        setUser(formattedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user
    } catch (error: any) {
      // Map Firebase error codes to user-friendly messages
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      
      // Manually update local user state to reflect display name immediately
      const formattedUser: User = {
          uid: userCredential.user.uid,
          displayName: username,
          email: userCredential.user.email,
          photoURL: userCredential.user.photoURL,
      };
      setUser(formattedUser);
      // onAuthStateChanged will also fire, but this provides a more immediate UI update
      
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting the user
    } catch (error: any) {
        throw new Error(error.message || 'Google login failed');
    }
  };

  const refreshUser = async () => {
    await auth.currentUser?.reload();
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const formattedUser: User = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      };
      setUser(formattedUser);
    } else {
      setUser(null);
    }
  };

  const setNickname = async (username: string) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await updateProfile(currentUser, { displayName: username });
        // Manually trigger a refresh to get the updated user object
        await refreshUser();
      } catch (error: any) {
        throw new Error(error.message || 'Failed to update nickname');
      }
    } else {
      throw new Error('No user is currently signed in.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting the user to null
    } catch (error: any) {
        throw new Error(error.message || 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        refreshUser,
        setNickname,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
