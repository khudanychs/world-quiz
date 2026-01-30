import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

// Firebase User type (minimal definition to avoid importing the full module)
interface FirebaseUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata: { creationTime?: string };
  providerData: Array<{ providerId: string }>;
  delete: () => Promise<void>;
}

// Lazy-loaded Firebase modules to avoid blocking initial render
let firebaseAuth: typeof import('firebase/auth') | null = null;
let firebaseFirestore: typeof import('firebase/firestore') | null = null;
let authInstance: import('firebase/auth').Auth | null = null;
let dbInstance: import('firebase/firestore').Firestore | null = null;

// Initialize Firebase lazily
async function getFirebaseModules() {
  if (!firebaseAuth || !firebaseFirestore) {
    const [authModule, firestoreModule, firebaseModule] = await Promise.all([
      import('firebase/auth'),
      import('firebase/firestore'),
      import('../firebase'),
    ]);
    firebaseAuth = authModule;
    firebaseFirestore = firestoreModule;
    authInstance = firebaseModule.auth;
    dbInstance = firebaseModule.db;
  }
  return { 
    auth: firebaseAuth!, 
    firestore: firebaseFirestore!, 
    authInstance: authInstance!, 
    db: dbInstance! 
  };
}

// A custom User type to combine Firebase User and our custom fields if needed
// For now, it will mostly mirror FirebaseUser's relevant fields
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string | null;
  profileFlag: string | null; // Country code for profile picture flag
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    (async () => {
      try {
        const { auth, firestore, authInstance, db } = await getFirebaseModules();
        setFirebaseReady(true);
        
        unsubscribe = auth.onAuthStateChanged(authInstance, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            // Check if username exists in Firestore, if not create it
            // This is a fallback in case registration failed to create it
            if (firebaseUser.displayName) {
              try {
                const usernameDoc = await firestore.getDoc(firestore.doc(db, 'usernames', firebaseUser.uid));
                if (!usernameDoc.exists()) {
                  // Check if username is already taken, add suffix if needed
                  let username = firebaseUser.displayName;
                  let usernameToUse = username;
                  let suffix = 1;
                  
                  while (true) {
                    const usernameQuery = firestore.query(
                      firestore.collection(db, 'usernames'),
                      firestore.where('username_lower', '==', usernameToUse.toLowerCase())
                    );
                    const existingUsername = await firestore.getDocs(usernameQuery);
                    
                    if (existingUsername.empty) {
                      break;
                    }
                    suffix++;
                    usernameToUse = `${username}${suffix}`;
                  }
                  
                  // Update displayName if suffix was added
                  if (usernameToUse !== username) {
                    await auth.updateProfile(firebaseUser, { displayName: usernameToUse });
                  }
                  
                  await firestore.setDoc(firestore.doc(db, 'usernames', firebaseUser.uid), {
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
            
            // Load profile flag from Firestore or localStorage cache
            let profileFlag: string | null = null;
            const cachedFlag = localStorage.getItem(`profileFlag_${firebaseUser.uid}`);
            
            if (cachedFlag) {
              profileFlag = cachedFlag;
            }
            
            // Fetch from Firestore (in background if cached)
            try {
              const userDocRef = firestore.doc(db, 'users', firebaseUser.uid);
              const userDocSnap = await firestore.getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.profileFlag) {
                  profileFlag = userData.profileFlag;
                  localStorage.setItem(`profileFlag_${firebaseUser.uid}`, userData.profileFlag);
                } else if (cachedFlag) {
                  // Flag was removed, clear cache
                  localStorage.removeItem(`profileFlag_${firebaseUser.uid}`);
                  profileFlag = null;
                }
              }
            } catch (error) {
              console.error('Error loading profile flag:', error);
              // Use cached value if fetch fails
            }
            
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
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        setLoading(false);
      }
    })();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { auth, authInstance } = await getFirebaseModules();
    try {
      const userCredential = await auth.signInWithEmailAndPassword(authInstance, email, password);
      if (!userCredential.user.emailVerified) {
        // Sign out immediately if email not verified
        await auth.signOut(authInstance);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
      // onAuthStateChanged will handle setting the user
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const { auth, firestore, authInstance, db } = await getFirebaseModules();
    try {
      // Check if username is already taken
      const usernameQuery = firestore.query(
        firestore.collection(db, 'usernames'), 
        firestore.where('username_lower', '==', username.toLowerCase())
      );
      const usernameSnapshot = await firestore.getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        throw new Error('Username already in use. Please choose a different one.');
      }
      
      // Create user account
      const userCredential = await auth.createUserWithEmailAndPassword(authInstance, email, password);
      
      // CRITICAL: Do all these operations sequentially and wait for each
      try {
        // 1. Update display name
        await auth.updateProfile(userCredential.user, { displayName: username });
        
        // 2. Reserve the username in Firestore - critical for uniqueness
        await firestore.setDoc(firestore.doc(db, 'usernames', userCredential.user.uid), {
          username: username,
          username_lower: username.toLowerCase(),
          userId: userCredential.user.uid,
          createdAt: new Date()
        }, { merge: false });
        
        // 3. Send verification email
        await auth.sendEmailVerification(userCredential.user);
        
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
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { auth, firestore, authInstance, db } = await getFirebaseModules();
    try {
      const provider = new auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(authInstance, provider);
      
      // Always check if username exists in Firestore, if not, create it
      if (result.user.displayName) {
        const usernameDoc = await firestore.getDoc(firestore.doc(db, 'usernames', result.user.uid));
        
        if (!usernameDoc.exists()) {
          // User doesn't have a username record, create one
          // But first check if the Google displayName is already taken
          let username = result.user.displayName;
          let usernameToUse = username;
          let suffix = 1;
          
          // Keep trying with incremented suffix until we find unique username
          while (true) {
            const usernameQuery = firestore.query(
              firestore.collection(db, 'usernames'),
              firestore.where('username_lower', '==', usernameToUse.toLowerCase())
            );
            const existingUsername = await firestore.getDocs(usernameQuery);
            
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
            await auth.updateProfile(result.user, { displayName: usernameToUse });
          }
          
          await firestore.setDoc(firestore.doc(db, 'usernames', result.user.uid), {
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
  }, []);

  const refreshUser = useCallback(async () => {
    const { authInstance } = await getFirebaseModules();
    await authInstance.currentUser?.reload();
    const firebaseUser = authInstance.currentUser;
    if (firebaseUser) {
      // Preserve existing profileFlag from current user state or localStorage
      const cachedFlag = localStorage.getItem(`profileFlag_${firebaseUser.uid}`);
      const formattedUser: User = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        createdAt: firebaseUser.metadata.creationTime || null,
        profileFlag: user?.profileFlag || cachedFlag || null,
      };
      setUser(formattedUser);
    } else {
      setUser(null);
    }
  }, [user?.profileFlag]);

  const sendVerificationEmail = useCallback(async () => {
    const { auth, authInstance } = await getFirebaseModules();
    const currentUser = authInstance.currentUser;
    if (currentUser && !currentUser.emailVerified) {
      try {
        await auth.sendEmailVerification(currentUser);
      } catch (error: any) {
        throw new Error(getFirebaseErrorMessage(error));
      }
    } else if (!currentUser) {
      throw new Error('No user is currently signed in.');
    } else {
      throw new Error('Email is already verified.');
    }
  }, []);

  const setNickname = useCallback(async (username: string) => {
    const { auth, firestore, authInstance, db } = await getFirebaseModules();
    const currentUser = authInstance.currentUser;
    if (currentUser) {
      try {
        // Check if username is already taken by someone else
        const usernameQuery = firestore.query(
          firestore.collection(db, 'usernames'), 
          firestore.where('username_lower', '==', username.toLowerCase())
        );
        const usernameSnapshot = await firestore.getDocs(usernameQuery);
        
        if (!usernameSnapshot.empty) {
          // Check if it's taken by another user
          const existingDoc = usernameSnapshot.docs[0];
          if (existingDoc.id !== currentUser.uid) {
            throw new Error('Username already in use. Please choose a different one.');
          }
        }
        
        // Get old username document to delete it
        const oldUsernameDoc = await firestore.getDoc(firestore.doc(db, 'usernames', currentUser.uid));
        
        // Update Firebase Auth profile
        await auth.updateProfile(currentUser, { displayName: username });
        
        // Update or create username document in Firestore
        await firestore.setDoc(firestore.doc(db, 'usernames', currentUser.uid), {
          username: username,
          username_lower: username.toLowerCase(),
          userId: currentUser.uid,
          updatedAt: new Date()
        });
        
        // Update username in user's all-time streak record (document ID = user.uid)
        const streakDocRef = firestore.doc(db, 'streaks', currentUser.uid);
        const streakDoc = await firestore.getDoc(streakDocRef);
        
        if (streakDoc.exists()) {
          await firestore.updateDoc(streakDocRef, { username: username });
        }
        
        // Update username in user's daily streak records
        const dailyStreaksQuery = firestore.query(
          firestore.collection(db, 'dailyStreaks'),
          firestore.where('userId', '==', currentUser.uid)
        );
        const dailyStreaksSnapshot = await firestore.getDocs(dailyStreaksQuery);
        
        for (const dailyDoc of dailyStreaksSnapshot.docs) {
          await firestore.updateDoc(dailyDoc.ref, { username: username });
        }
        
        // Manually trigger a refresh to get the updated user object
        await refreshUser();
      } catch (error: any) {
        throw new Error(getFirebaseErrorMessage(error));
      }
    } else {
      throw new Error('No user is currently signed in.');
    }
  }, [refreshUser]);

  const setProfileFlag = useCallback(async (flag: string | null) => {
    const { firestore, authInstance, db } = await getFirebaseModules();
    const currentUser = authInstance.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in.');
    }

    try {
      const userDocRef = firestore.doc(db, 'users', currentUser.uid);
      await firestore.setDoc(userDocRef, { profileFlag: flag }, { merge: true });
      
      // Update localStorage cache
      if (flag) {
        localStorage.setItem(`profileFlag_${currentUser.uid}`, flag);
      } else {
        localStorage.removeItem(`profileFlag_${currentUser.uid}`);
      }
      
      // Update user state immediately
      if (user) {
        setUser({ ...user, profileFlag: flag });
      }
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }, [user]);

  const deleteAccount = useCallback(async (password?: string) => {
    const { auth, firestore, authInstance, db } = await getFirebaseModules();
    const currentUser = authInstance.currentUser;
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
        const provider = new auth.GoogleAuthProvider();
        await auth.reauthenticateWithPopup(currentUser, provider);
      } else {
        // Re-authenticate with email/password
        if (!password) {
          throw new Error('Password is required to delete your account.');
        }
        if (!currentUser.email) {
          throw new Error('Email not found.');
        }
        const credential = auth.EmailAuthProvider.credential(currentUser.email, password);
        await auth.reauthenticateWithCredential(currentUser, credential);
      }

      // Delete username from Firestore
      await firestore.deleteDoc(firestore.doc(db, 'usernames', currentUser.uid));
      
      // Delete all user's scores
      const scoresQuery = firestore.query(
        firestore.collection(db, 'scores'),
        firestore.where('userId', '==', currentUser.uid)
      );
      const scoresSnapshot = await firestore.getDocs(scoresQuery);
      const deletePromises = scoresSnapshot.docs.map(doc => firestore.deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the authentication account
      // Note: Firebase Delete User Data extension will handle remaining cleanup
      await currentUser.delete();
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  }, []);

  const logout = useCallback(async () => {
    const { auth, authInstance } = await getFirebaseModules();
    try {
      await auth.signOut(authInstance);
      // onAuthStateChanged will handle setting the user to null
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
