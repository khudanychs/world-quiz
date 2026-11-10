import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import i18n, { ensureLanguageResources } from '../i18n';
import { getBaseLanguage } from '../utils/localeRouting';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string | null;
  profileFlag: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setNickname: (username: string) => Promise<void>;
  setProfileFlag: (flag: string | null) => Promise<void>;
  refreshUser: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readCachedProfileFlag(uid: string): string | null {
  try {
    return localStorage.getItem(`profileFlag_${uid}`);
  } catch {
    // Storage restrictions must not prevent Firebase from resolving the session.
    return null;
  }
}

function cacheProfileFlag(uid: string, flag: string | null): void {
  try {
    if (flag) {
      localStorage.setItem(`profileFlag_${uid}`, flag);
    } else {
      localStorage.removeItem(`profileFlag_${uid}`);
    }
  } catch {
    // The cache is optional; the in-memory profile remains usable without it.
  }
}

async function syncPreferredLanguage(
  language: 'en' | 'cs' | 'de' | null,
  isCurrentSession: () => boolean,
): Promise<void> {
  if (!language || getBaseLanguage(i18n.language) === language) return;

  await ensureLanguageResources(language);
  // A translation import may finish after logout or an account switch.
  if (isCurrentSession()) await i18n.changeLanguage(language);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // UID alone cannot distinguish a previous session after signing into the same account again.
  const sessionVersionRef = useRef(0);
  const isCurrentSession = useCallback((firebaseUser: FirebaseUser, version: number) => (
    sessionVersionRef.current === version && auth.currentUser?.uid === firebaseUser.uid
  ), []);

  /**
   * Route Protection Architecture
   * 
   * Two-phase auth state initialization:
   * 1. Instant unlock: Firebase auth state from IndexedDB cache (~50ms)
   * 2. Background sync: Firestore profile data fetched asynchronously
   * 
   * This prevents the common auth waterfall that blocks UI rendering.
   */
  useEffect(() => {
    let disposed = false;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (disposed) return;
      const sessionVersion = ++sessionVersionRef.current;
      
      if (firebaseUser) {
        const cachedFlag = readCachedProfileFlag(firebaseUser.uid);
        const isSessionActive = () => !disposed && isCurrentSession(firebaseUser, sessionVersion);
        
        const basicUser: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          createdAt: firebaseUser.metadata.creationTime || null,
          profileFlag: cachedFlag,
        };
        
        setUser(basicUser);
        setLoading(false);
        
        (async () => {
          if (!isSessionActive()) return;
          
          if (firebaseUser.displayName) {
            try {
              const usernameDoc = await getDoc(doc(db, 'usernames', firebaseUser.uid));
              if (!isSessionActive()) return;
              if (!usernameDoc.exists()) {
                let username = firebaseUser.displayName;
                let usernameToUse = username;
                let suffix = 1;
                
                while (true) {
                  const usernameQuery = query(
                    collection(db, 'usernames'),
                    where('username_lower', '==', usernameToUse.toLowerCase())
                  );
                  const existingUsername = await getDocs(usernameQuery);
                  if (!isSessionActive()) return;
                  
                  if (existingUsername.empty) break;
                  suffix++;
                  usernameToUse = `${username}${suffix}`;
                }
                
                if (usernameToUse !== username) {
                  await updateProfile(firebaseUser, { displayName: usernameToUse });
                  if (!isSessionActive()) return;
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
            }
          }
          if (!isSessionActive()) return;
          
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!isSessionActive()) return;
            
            let profileFlag: string | null = cachedFlag;
            let preferredLanguage: 'en' | 'cs' | 'de' | null = null;
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              
              if (userData.profileFlag) {
                profileFlag = userData.profileFlag;
                cacheProfileFlag(firebaseUser.uid, userData.profileFlag);
              } else if (cachedFlag) {
                cacheProfileFlag(firebaseUser.uid, null);
                profileFlag = null;
              }
              
              if (typeof userData.preferredLanguage === 'string') {
                preferredLanguage = getBaseLanguage(userData.preferredLanguage);
              }
            }
            
            await syncPreferredLanguage(preferredLanguage, isSessionActive);
            
            if (isSessionActive()) {
              setUser(prev => prev?.uid === firebaseUser.uid ? { ...prev, profileFlag } : prev);
            }
          } catch (error) {
            console.error('Error loading profile data:', error);
          }
        })();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      disposed = true;
      sessionVersionRef.current++;
      unsubscribe();
    };
  }, [isCurrentSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      const usernameQuery = query(
        collection(db, 'usernames'), 
        where('username_lower', '==', username.toLowerCase())
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        throw new Error('Username already in use. Please choose a different one.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        await updateProfile(userCredential.user, { displayName: username });
        
        await setDoc(doc(db, 'usernames', userCredential.user.uid), {
          username: username,
          username_lower: username.toLowerCase(),
          userId: userCredential.user.uid,
          createdAt: new Date()
        }, { merge: false });
        
        await sendEmailVerification(userCredential.user);
      } catch (firestoreError: any) {
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
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user.displayName) {
        const usernameDoc = await getDoc(doc(db, 'usernames', result.user.uid));
        
        if (!usernameDoc.exists()) {
          let username = result.user.displayName;
          let usernameToUse = username;
          let suffix = 1;
          
          while (true) {
            const usernameQuery = query(
              collection(db, 'usernames'),
              where('username_lower', '==', usernameToUse.toLowerCase())
            );
            const existingUsername = await getDocs(usernameQuery);
            
            if (existingUsername.empty) break;
            
            suffix++;
            usernameToUse = `${username}${suffix}`;
          }
          
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
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    const sessionVersion = sessionVersionRef.current;
    if (firebaseUser) {
      const isSessionActive = () => isCurrentSession(firebaseUser, sessionVersion);
      await firebaseUser.reload();
      if (!isSessionActive()) return;

      let profileFlag: string | null = null;
      let preferredLanguage: 'en' | 'cs' | 'de' | null = null;
      
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!isSessionActive()) return;
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.profileFlag) {
            profileFlag = userData.profileFlag;
            cacheProfileFlag(firebaseUser.uid, userData.profileFlag);
          } else {
            cacheProfileFlag(firebaseUser.uid, null);
            profileFlag = null;
          }

          if (typeof userData.preferredLanguage === 'string') {
            preferredLanguage = getBaseLanguage(userData.preferredLanguage);
          }
        }
      } catch (error) {
        console.error('Error loading profile flag:', error);
        profileFlag = readCachedProfileFlag(firebaseUser.uid);
      }

      await syncPreferredLanguage(preferredLanguage, isSessionActive);
      if (!isSessionActive()) return;
      
      const formattedUser: User = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime || null,
        profileFlag,
      };
      setUser(formattedUser);
    } else {
      setUser(null);
    }
  }, [isCurrentSession]);

  const sendVerificationEmail = useCallback(async () => {
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
  }, []);

  const NICK_CHANGE_LIMIT = 2;
  const NICK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

  const setNickname = useCallback(async (username: string) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const usernameQuery = query(
          collection(db, 'usernames'), 
          where('username_lower', '==', username.toLowerCase())
        );
        const usernameSnapshot = await getDocs(usernameQuery);
        
        if (!usernameSnapshot.empty) {
          const existingDoc = usernameSnapshot.docs[0];
          if (existingDoc.id !== currentUser.uid) {
            throw new Error('Username already in use. Please choose a different one.');
          }
        }
        
        const usernameDocRef = doc(db, 'usernames', currentUser.uid);
        const currentUsernameDoc = await getDoc(usernameDocRef);

        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let newNickChangesCount = 1;

        if (currentUsernameDoc.exists()) {
          const data = currentUsernameDoc.data();
          const storedMonthKey: string = data.nickChangesMonthKey ?? '';
          const storedCount: number = typeof data.nickChangesCount === 'number' ? data.nickChangesCount : 0;
          const lastChangedAt: Date | null = data.lastNickChangeAt?.toDate?.() ?? null;

          if (storedMonthKey === currentMonthKey && storedCount >= NICK_CHANGE_LIMIT) {
            throw new Error(`You can only change your nickname ${NICK_CHANGE_LIMIT} times per month. Try again next month.`);
          }

          if (lastChangedAt) {
            const elapsed = now.getTime() - lastChangedAt.getTime();
            if (elapsed < NICK_COOLDOWN_MS) {
              const daysLeft = Math.ceil((NICK_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
              throw new Error(
                `Please wait ${daysLeft} more day${daysLeft !== 1 ? 's' : ''} before changing your nickname again.`
              );
            }
          }

          newNickChangesCount = storedMonthKey === currentMonthKey ? storedCount + 1 : 1;
        }
        
        await updateProfile(currentUser, { displayName: username });
        
        await setDoc(usernameDocRef, {
          username: username,
          username_lower: username.toLowerCase(),
          userId: currentUser.uid,
          updatedAt: serverTimestamp(),
          nickChangesCount: newNickChangesCount,
          nickChangesMonthKey: currentMonthKey,
          lastNickChangeAt: serverTimestamp(),
        }, { merge: true });
        
        const streakDocRef = doc(db, 'streaks', currentUser.uid);
        const streakDoc = await getDoc(streakDocRef);
        
        if (streakDoc.exists()) {
          await updateDoc(streakDocRef, { username: username });
        }
        
        const dailyStreaksQuery = query(
          collection(db, 'dailyStreaks'),
          where('userId', '==', currentUser.uid)
        );
        const dailyStreaksSnapshot = await getDocs(dailyStreaksQuery);
        
        for (const dailyDoc of dailyStreaksSnapshot.docs) {
          await updateDoc(dailyDoc.ref, { username: username });
        }
        
        await refreshUser();
      } catch (error: any) {
        throw new Error(getFirebaseErrorMessage(error));
      }
    } else {
      throw new Error('No user is currently signed in.');
    }
  }, [refreshUser]);

  const setProfileFlag = useCallback(async (flag: string | null) => {
    const currentUser = auth.currentUser;
    const sessionVersion = sessionVersionRef.current;
    if (!currentUser) {
      throw new Error('No user is currently signed in.');
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { profileFlag: flag }, { merge: true });
      if (!isCurrentSession(currentUser, sessionVersion)) return;
      
      cacheProfileFlag(currentUser.uid, flag);
      setUser(prev => prev?.uid === currentUser.uid ? { ...prev, profileFlag: flag } : prev);
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }, [isCurrentSession]);

  const deleteAccount = useCallback(async (password?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in.');
    }

    try {
      const isGoogleUser = currentUser.providerData.some(
        provider => provider.providerId === 'google.com'
      );

      if (isGoogleUser) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        if (!password) {
          throw new Error('Password is required to delete your account.');
        }
        if (!currentUser.email) {
          throw new Error('Email not found.');
        }
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      }

      await deleteDoc(doc(db, 'usernames', currentUser.uid));
      
      await currentUser.delete();
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }, []);

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
        setProfileFlag,
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
