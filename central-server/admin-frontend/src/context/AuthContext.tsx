'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Login } from '@/client';
import { useMutation } from '@tanstack/react-query';
import { loginMutation, logoutMutation } from '@/client/@tanstack/react-query.gen';
import { tokenStore } from '@/lib/token-store';
import { client } from '@/client/client.gen';

export type User = {
  id?: number;
  role?: string;
  username?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: Login) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isHydrating: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const loginMutationInstance = useMutation({
    ...loginMutation(),
  });

  const logoutMutationInstance = useMutation({
    ...logoutMutation(),
  })

  // useEffect(()=> {
  //   const bootstrap = async () => {
  //     try {
  //       const res = await client.instance.post(
  //         "/api/v1/auth/refresh"
  //       );

  //       const token = res.data.accessToken;
  //       const user = res.data.user;

  //       if (!token || !user){
  //         throw new Error("Missing user or access token");
  //       }
  //       tokenStore.set(token);
  //       setUser(user);
  //     } catch (error) {
  //       setUser(null);
  //     }finally{
  //       setIsHydrating(false)
  //     }
  //   }

  //   bootstrap();
  // },[])

  // const authCheckInstance = useMutation({
  //   ...authCheckMutation(),
  // })

  //restore user on app load
  useEffect(() => {
    const restoreUser = async () => {
      const token = tokenStore.get();

      if(!token){
        setIsHydrating(false);
        return
      }

      try {
        const res = await client.instance.post(
          "/api/v1/auth/refresh"
        );

        const token = res.data.accessToken;
        const user = res.data.user;
        if (!token || !user) {
          throw new Error("Missing User or Token");
        }
        tokenStore.set(token)
        setUser(user)
      } catch (error) {
        tokenStore.clear();
        setUser(null);
      }finally{
        setIsHydrating(false);
      }
    }
    restoreUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const login = async (data: Login) => {
    try {
      const res = await loginMutationInstance.mutateAsync({
        body: data,
      })
      const token = res.accessToken;
      const user = res.user;
      if (!token || !user) {
        throw new Error("Missing User or Token");
      }
      tokenStore.set(token)
      setUser(user)
    } catch (error) {
      toast.error("invalid username or password")
      throw error
    }
  }

  const logout = async () => {
    try {
      await logoutMutationInstance.mutateAsync({});
    } finally {
      tokenStore.clear();
      setUser(null);
      window.location.href = "/login";
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading: loginMutationInstance.isPending, isHydrating }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
