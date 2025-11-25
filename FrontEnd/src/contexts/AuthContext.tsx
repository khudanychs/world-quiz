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
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
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
  createdAt: string | null;
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
  deleteAccount: (password?: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // CRITICAL: Block unverified email/password users
        // Google users are auto-verified, so only check email/password accounts
        const isEmailPasswordUser = firebaseUser.providerData.some(
          provider => provider.providerId === 'password'
        );
        
        if (isEmailPasswordUser && !firebaseUser.emailVerified) {
          console.log('⚠️ User has unverified email, signing out immediately');
          // Sign out unverified users immediately
          // This ensures they stay as "guest" and can use the app normally
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
        
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
          createdAt: firebaseUser.metadata.creationTime || null,
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
      console.log('🔍 Starting registration for:', email);
      
      // Check if username is already taken
      console.log('🔍 Checking if username is taken:', username);
      const usernameQuery = query(collection(db, 'usernames'), where('username_lower', '==', username.toLowerCase()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        console.log('❌ Username already taken');
        throw new Error('Username already in use. Please choose a different one.');
      }
      
      console.log('✅ Username available');
      
      // Create user account
      console.log('🔍 Creating Firebase auth account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Auth account created:', userCredential.user.uid);
      
      // CRITICAL: Do all these operations sequentially and wait for each
      try {
        // 1. Update display name
        console.log('🔍 Updating display name...');
        await updateProfile(userCredential.user, { displayName: username });
        console.log('✅ Display name updated');
        
        // 2. Reserve the username in Firestore - critical for uniqueness
        console.log('🔍 Saving username to Firestore...');
        await setDoc(doc(db, 'usernames', userCredential.user.uid), {
          username: username,
          username_lower: username.toLowerCase(),
          userId: userCredential.user.uid,
          createdAt: new Date()
        }, { merge: false });
        console.log('✅ Username saved to Firestore');
        
        // 3. Send verification email
        console.log('🔍 Sending verification email...');
        await sendEmailVerification(userCredential.user);
        console.log('✅ Verification email sent');
        
        // 4. Sign out the user immediately - they must verify email first
        console.log('🔍 Signing out user until email is verified...');
        await signOut(auth);
        console.log('✅ Registration complete!');
        
        // User is now signed out and must verify email before logging in
      } catch (firestoreError: any) {
        // If anything fails, delete the auth account to keep things consistent
        console.error('❌ Failed to complete registration:', firestoreError);
        console.error('Error details:', firestoreError.message, firestoreError.code);
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error('Failed to delete user after error:', deleteError);
        }
        throw new Error('Failed to complete registration. Please check your internet connection and try again.');
      }
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
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
        createdAt: firebaseUser.metadata.creationTime || null,
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

  const deleteAccount = async (password?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in.');
    }

    try {
      // Re-authenticate user before deletion (required by Firebase)
      const isGoogleUser = currentUser.providerData.some(
        provider => provider.providerId === 'google.com'
      );

      if (isGoogleUser) {
        // Re-authenticate with Google
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        // Re-authenticate with email/password
        if (!password) {
          throw new Error('Password is required to delete your account.');
        }
        if (!currentUser.email) {
          throw new Error('Email not found.');
        }
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Delete username from Firestore
      await deleteDoc(doc(db, 'usernames', currentUser.uid));
      
      // Delete all user's scores
      const scoresQuery = query(
        collection(db, 'scores'),
        where('userId', '==', currentUser.uid)
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      const deletePromises = scoresSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the authentication account
      // Note: Firebase Delete User Data extension will handle remaining cleanup
      await currentUser.delete();
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
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
        deleteAccount,
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
