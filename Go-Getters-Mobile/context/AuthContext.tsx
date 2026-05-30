import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserRole, LeaderOption } from '@/types';
import { api, setToken, clearToken } from '@/lib/api';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  allUsers: User[];
  leaders: LeaderOption[];
  pendingUsers: User[];
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    leaderId?: string,
    leaderName?: string,
    sponsorId?: string,
    sponsorName?: string,
    adminCode?: string,
  ) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string, reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<LeaderOption[]>([]);

  const pendingUsers = allUsers.filter((u) => u.status === 'pending');

  const refreshLeaders = useCallback(async () => {
    try {
      const { leaders: l } = await api.get<{ leaders: LeaderOption[] }>('/users/leaders');
      setLeaders(l);
    } catch {}
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const { users } = await api.get<{ users: User[] }>('/users');
      setAllUsers(users);
    } catch {}
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('gg_token').then(async (token) => {
      if (!token) { setIsLoading(false); return; }
      try {
        const { user } = await api.get<{ user: User }>('/auth/me');
        setCurrentUser(user);
        await refreshLeaders();
        if (user.role === 'admin') await refreshUsers();
      } catch {
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    await setToken(token);
    setCurrentUser(user);
    await refreshLeaders();
    if (user.role === 'admin') await refreshUsers();
    return user;
  }, [refreshLeaders, refreshUsers]);

  const register = useCallback(async (
    name: string, email: string, password: string, role: UserRole,
    leaderId?: string, leaderName?: string, sponsorId?: string, sponsorName?: string, adminCode?: string,
  ): Promise<User> => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', {
      name, email, password, role, leaderId, leaderName, sponsorId, sponsorName, adminCode,
    });
    await setToken(token);
    setCurrentUser(user);
    await refreshLeaders();
    return user;
  }, [refreshLeaders]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    await clearToken();
    setCurrentUser(null);
    setAllUsers([]);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    const { user } = await api.patch<{ user: User }>(`/users/${currentUser.id}`, updates);
    setCurrentUser(user);
    await AsyncStorage.setItem('gg_cached_user', JSON.stringify(user));
  }, [currentUser]);

  const approveUser = useCallback(async (id: string) => {
    const { user } = await api.post<{ user: User }>(`/users/${id}/approve`);
    setAllUsers((prev) => prev.map((u) => u.id === id ? user : u));
    if (currentUser?.id === id) setCurrentUser(user);
  }, [currentUser]);

  const rejectUser = useCallback(async (id: string, reason: string) => {
    const { user } = await api.post<{ user: User }>(`/users/${id}/reject`, { reason });
    setAllUsers((prev) => prev.map((u) => u.id === id ? user : u));
    if (currentUser?.id === id) setCurrentUser(user);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser, isLoading, allUsers, leaders, pendingUsers,
      login, register, logout, updateUser, approveUser, rejectUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
