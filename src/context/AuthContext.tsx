import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  shop_name?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  profile_image?: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: uid, ...userDoc.data() } as UserData;
    }
    return null;
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      const data = await fetchUserData(auth.currentUser.uid);
      setUser(data);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const data = await fetchUserData(firebaseUser.uid);
        setUser(data);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async ({ email, password }: any) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async ({ email, password, name, role }: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    const userData: UserData = {
      id: uid,
      name,
      email,
      role: role || 'buyer',
      created_at: serverTimestamp() as any
    };

    await setDoc(doc(db, 'users', uid), userData);
    setUser(userData);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const uid = result.user.uid;
    const existing = await fetchUserData(uid);
    
    if (!existing) {
       const userData: UserData = {
          id: uid,
          name: result.user.displayName || 'User',
          email: result.user.email || '',
          role: 'buyer',
          profile_image: result.user.photoURL || '',
          created_at: serverTimestamp() as any
       };
       await setDoc(doc(db, 'users', uid), userData);
       setUser(userData);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, refreshUser }}>
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
