import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser // Rename to avoid conflict if any
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

// A custom User type to combine Firebase User and our custom fields if needed
// For now, it will mostly mirror FirebaseUser's relevant fields
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
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
  sendVerificationEmail: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Check if username exists in Firestore, if not create it
        // This is a fallback in case registration failed to create it
        if (firebaseUser.displayName) {
          try {
            const usernameDoc = await getDoc(doc(db, 'usernames', firebaseUser.uid));
            if (!usernameDoc.exists()) {
              console.log('⚠️ Username not found in Firestore, creating it now...');
              // Username record doesn't exist, create it now
              await setDoc(doc(db, 'usernames', firebaseUser.uid), {
                username: firebaseUser.displayName,
                username_lower: firebaseUser.displayName.toLowerCase(),
                userId: firebaseUser.uid,
                createdAt: new Date()
              }, { merge: false });
              console.log('✅ Username synced to Firestore');
            }
          } catch (error) {
            console.error('❌ Failed to sync username to Firestore:', error);
            // Don't block login if this fails
          }
        }
        
        const formattedUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        // Sign out immediately if email not verified
        await signOut(auth);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
      // onAuthStateChanged will handle setting the user
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      // Check if username is already taken
      const usernameQuery = query(collection(db, 'usernames'), where('username_lower', '==', username.toLowerCase()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        throw new Error('Username already in use. Please choose a different one.');
      }
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // CRITICAL: Do all these operations sequentially and wait for each
      try {
        // 1. Update display name
        await updateProfile(userCredential.user, { displayName: username });
        console.log('✅ Display name updated');
        
        // 2. Reserve the username in Firestore - critical for uniqueness
        await setDoc(doc(db, 'usernames', userCredential.user.uid), {
          username: username,
          username_lower: username.toLowerCase(),
          userId: userCredential.user.uid,
          createdAt: new Date()
        }, { merge: false });
        console.log('✅ Username saved to Firestore');
        
        // 3. Send verification email
        await sendEmailVerification(userCredential.user);
        console.log('✅ Verification email sent');
        
        // User stays logged in but will see verification message
        // onAuthStateChanged will handle setting the user with emailVerified: false
      } catch (firestoreError: any) {
        // If anything fails, delete the auth account to keep things consistent
        console.error('❌ Failed to complete registration:', firestoreError);
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error('Failed to delete user after error:', deleteError);
        }
        throw new Error('Failed to complete registration. Please check your internet connection and try again.');
      }
      
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Always check if username exists in Firestore, if not, create it
      if (result.user.displayName) {
        const usernameDoc = await getDoc(doc(db, 'usernames', result.user.uid));
        
        if (!usernameDoc.exists()) {
          // User doesn't have a username record, create one
          const username = result.user.displayName;
          await setDoc(doc(db, 'usernames', result.user.uid), {
            username: username,
            username_lower: username.toLowerCase(),
            userId: result.user.uid,
            createdAt: new Date()
          });
        }
      }
      
      // onAuthStateChanged will handle setting the user
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
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
        emailVerified: firebaseUser.emailVerified,
      };
      setUser(formattedUser);
    } else {
      setUser(null);
    }
  };

  const sendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.emailVerified) {
      try {
        await sendEmailVerification(currentUser);
      } catch (error: any) {
        throw new Error(getFirebaseErrorMessage(error));
      }
    } else if (!currentUser) {
      throw new Error('No user is currently signed in.');
    } else {
      throw new Error('Email is already verified.');
    }
  };

  const setNickname = async (username: string) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Check if username is already taken by someone else
        const usernameQuery = query(collection(db, 'usernames'), where('username_lower', '==', username.toLowerCase()));
        const usernameSnapshot = await getDocs(usernameQuery);
        
        if (!usernameSnapshot.empty) {
          // Check if it's taken by another user
          const existingDoc = usernameSnapshot.docs[0];
          if (existingDoc.id !== currentUser.uid) {
            throw new Error('Username already in use. Please choose a different one.');
          }
        }
        
        // Get old username document to delete it
        const oldUsernameDoc = await getDoc(doc(db, 'usernames', currentUser.uid));
        
        // Update Firebase Auth profile
        await updateProfile(currentUser, { displayName: username });
        
        // Update or create username document in Firestore
        await setDoc(doc(db, 'usernames', currentUser.uid), {
          username: username,
          username_lower: username.toLowerCase(),
          userId: currentUser.uid,
          updatedAt: new Date()
        });
        
        // Manually trigger a refresh to get the updated user object
        await refreshUser();
      } catch (error: any) {
        throw new Error(getFirebaseErrorMessage(error));
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
      throw new Error(getFirebaseErrorMessage(error));
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
        sendVerificationEmail,
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
