'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false); // finished checking storage
  }, []);

  const login = (username: string, password: string) => {
    const mockUser = {
      id: 1,
      email: "brandonichami@gmail.com",
      username: "ichami"
    };

    if (username === 'test' && password === '123456') {
      localStorage.setItem("user", JSON.stringify(mockUser));
      setUser(mockUser);
      router.push("/admin");
    } else {
      toast.error("Invalid username or password");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
