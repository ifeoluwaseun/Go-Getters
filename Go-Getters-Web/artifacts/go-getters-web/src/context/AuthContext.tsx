import { type ReactNode, createContext, useContext, useState, useEffect, useCallback } from "react";
import { type UserRole, type UserStatus, type User } from "./types";
import { api, setToken, clearToken } from "../lib/api";

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  allUsers: User[];
  pendingUsers: User[];
  leaders: { id: string; name: string }[];
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: UserRole, leaderId?: string, leaderName?: string, sponsorId?: string, sponsorName?: string, adminCode?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string, reason: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pendingUsers = allUsers.filter(u => u.status === 'pending');

  const refreshUsers = useCallback(async () => {
    try {
      const { users } = await api.get<{ users: User[] }>('/users');
      setAllUsers(users);
    } catch {}
  }, []);

  const refreshLeaders = useCallback(async () => {
    try {
      const { leaders: l } = await api.get<{ leaders: { id: string; name: string }[] }>('/users/leaders');
      setLeaders(l);
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('gg_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.get<{ user: User }>('/auth/me')
      .then(async ({ user }) => {
        setCurrentUser(user);
        if (user.role === 'admin') await refreshUsers();
        await refreshLeaders();
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(token);
    setCurrentUser(user);
    if (user.role === 'admin') await refreshUsers();
    await refreshLeaders();
    return user;
  }, [refreshUsers, refreshLeaders]);

  const register = useCallback(async (
    name: string, email: string, password: string, role: UserRole,
    leaderId?: string, leaderName?: string, sponsorId?: string, sponsorName?: string, adminCode?: string
  ): Promise<User> => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', {
      name, email, password, role, leaderId, leaderName, sponsorId, sponsorName, adminCode
    });
    setToken(token);
    setCurrentUser(user);
    await refreshLeaders();
    return user;
  }, [refreshLeaders]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearToken();
    setCurrentUser(null);
    setAllUsers([]);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    const { user } = await api.patch<{ user: User }>(`/users/${currentUser.id}`, updates);
    setCurrentUser(user);
    setAllUsers(prev => prev.map(u => u.id === user.id ? user : u));
  }, [currentUser]);

  const approveUser = useCallback(async (id: string) => {
    const { user } = await api.post<{ user: User }>(`/users/${id}/approve`);
    setAllUsers(prev => prev.map(u => u.id === id ? user : u));
    if (currentUser?.id === id) setCurrentUser(user);
  }, [currentUser]);

  const rejectUser = useCallback(async (id: string, reason: string) => {
    const { user } = await api.post<{ user: User }>(`/users/${id}/reject`, { reason });
    setAllUsers(prev => prev.map(u => u.id === id ? user : u));
    if (currentUser?.id === id) setCurrentUser(user);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser, isLoading, allUsers, pendingUsers, leaders,
      login, register, logout, updateUser, approveUser, rejectUser, refreshUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
