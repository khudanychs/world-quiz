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
import { doc, setDoc, getDoc, deleteDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
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
        // Check if username exists in Firestore, if not create it
        // This is a fallback in case registration failed to create it
        if (firebaseUser.displayName) {
          try {
            const usernameDoc = await getDoc(doc(db, 'usernames', firebaseUser.uid));
            if (!usernameDoc.exists()) {
              // Check if username is already taken, add suffix if needed
              let username = firebaseUser.displayName;
              let usernameToUse = username;
              let suffix = 1;
              
              while (true) {
                const usernameQuery = query(
                  collection(db, 'usernames'),
                  where('username_lower', '==', usernameToUse.toLowerCase())
                );
                const existingUsername = await getDocs(usernameQuery);
                
                if (existingUsername.empty) {
                  break;
                }
                suffix++;
                usernameToUse = `${username}${suffix}`;
              }
              
              // Update displayName if suffix was added
              if (usernameToUse !== username) {
                await updateProfile(firebaseUser, { displayName: usernameToUse });
              }
              
              await setDoc(doc(db, 'usernames', firebaseUser.uid), {
                username: usernameToUse,
                username_lower: usernameToUse.toLowerCase(),
                userId: firebaseUser.uid,
                createdAt: new Date()
              }, { merge: false });
            }
          } catch (error) {
            console.error('Failed to sync username to Firestore:', error);
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
        
        // 2. Reserve the username in Firestore - critical for uniqueness
        await setDoc(doc(db, 'usernames', userCredential.user.uid), {
          username: username,
          username_lower: username.toLowerCase(),
          userId: userCredential.user.uid,
          createdAt: new Date()
        }, { merge: false });
        
        // 3. Send verification email
        await sendEmailVerification(userCredential.user);
        
        // User stays logged in with emailVerified=false
        // They will see verification screen via VerifiedOrGuestRoute
      } catch (firestoreError: any) {
        // If anything fails, delete the auth account to keep things consistent
        console.error('Failed to complete registration:', firestoreError);
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
          // But first check if the Google displayName is already taken
          let username = result.user.displayName;
          let usernameToUse = username;
          let suffix = 1;
          
          // Keep trying with incremented suffix until we find unique username
          while (true) {
            const usernameQuery = query(
              collection(db, 'usernames'),
              where('username_lower', '==', usernameToUse.toLowerCase())
            );
            const existingUsername = await getDocs(usernameQuery);
            
            if (existingUsername.empty) {
              // This username is available
              break;
            }
            
            // Username taken, try with suffix
            suffix++;
            usernameToUse = `${username}${suffix}`;
          }
          
          // Update Firebase Auth displayName if we added suffix
          if (usernameToUse !== username) {
            await updateProfile(result.user, { displayName: usernameToUse });
          }
          
          await setDoc(doc(db, 'usernames', result.user.uid), {
            username: usernameToUse,
            username_lower: usernameToUse.toLowerCase(),
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
        
        // Update username in user's all-time streak record (document ID = user.uid)
        const streakDocRef = doc(db, 'streaks', currentUser.uid);
        const streakDoc = await getDoc(streakDocRef);
        
        if (streakDoc.exists()) {
          await updateDoc(streakDocRef, { username: username });
        }
        
        // Update username in user's daily streak records
        const dailyStreaksQuery = query(
          collection(db, 'dailyStreaks'),
          where('userId', '==', currentUser.uid)
        );
        const dailyStreaksSnapshot = await getDocs(dailyStreaksQuery);
        
        for (const dailyDoc of dailyStreaksSnapshot.docs) {
          await updateDoc(dailyDoc.ref, { username: username });
        }
        
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
