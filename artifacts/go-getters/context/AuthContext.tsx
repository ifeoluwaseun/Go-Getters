import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Rivera', email: 'admin@gogetters.app', role: 'admin', streak: 21, points: 4820, completionRate: 97, consistency: 95, joinedAt: '2024-01-15', title: 'Top Performer' },
  { id: '2', name: 'Marcus Johnson', email: 'leader@gogetters.app', role: 'leader', streak: 14, points: 3640, completionRate: 94, consistency: 89, joinedAt: '2024-02-01', title: 'Team Leader' },
  { id: '3', name: 'Sam Chen', email: 'member@gogetters.app', role: 'member', streak: 7, points: 2100, completionRate: 82, consistency: 77, joinedAt: '2024-03-10', title: 'Rising Star' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('gg_user').then((raw) => {
      if (raw) setCurrentUser(JSON.parse(raw));
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const found = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const user = found ?? MOCK_USERS[2];
    await AsyncStorage.setItem('gg_user', JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string, role: UserRole) => {
    const user: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      streak: 0,
      points: 0,
      completionRate: 0,
      consistency: 0,
      joinedAt: new Date().toISOString(),
      title: role === 'admin' ? 'Administrator' : role === 'leader' ? 'Team Leader' : 'Go-Getter',
    };
    await AsyncStorage.setItem('gg_user', JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('gg_user');
    setCurrentUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      AsyncStorage.setItem('gg_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
