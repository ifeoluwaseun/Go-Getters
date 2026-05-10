import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserRole, UserStatus, LeaderOption } from '@/types';

export const ADMIN_CODE = 'GOGETTERS2024';

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
  updateUser: (updates: Partial<User>) => void;
  approveUser: (id: string) => void;
  rejectUser: (id: string, reason: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const MOCK_USERS: User[] = [
  {
    id: '1', name: 'Alex Rivera', email: 'admin@gogetters.app', role: 'admin', status: 'approved',
    streak: 21, points: 4820, completionRate: 97, consistency: 95, joinedAt: '2024-01-15',
    title: 'Organization Owner',
  },
  {
    id: '2', name: 'Marcus Johnson', email: 'leader@gogetters.app', role: 'leader', status: 'approved',
    leaderId: '1', leaderName: 'Alex Rivera', sponsorId: '1', sponsorName: 'Alex Rivera',
    streak: 14, points: 3640, completionRate: 94, consistency: 89, joinedAt: '2024-02-01',
    title: 'Team Leader',
  },
  {
    id: '4', name: 'Sam Chen', email: 'member@gogetters.app', role: 'member', status: 'approved',
    leaderId: '2', leaderName: 'Marcus Johnson', sponsorId: '2', sponsorName: 'Marcus Johnson',
    streak: 7, points: 2100, completionRate: 82, consistency: 77, joinedAt: '2024-03-10',
    title: 'Rising Star',
  },
];

const PENDING_SEED: User[] = [
  {
    id: 'pending1', name: 'Taylor Morgan', email: 'taylor@example.com', role: 'member', status: 'pending',
    leaderId: '2', leaderName: 'Marcus Johnson', sponsorId: '2', sponsorName: 'Marcus Johnson',
    streak: 0, points: 0, completionRate: 0, consistency: 0, joinedAt: new Date().toISOString(),
    title: 'Go-Getter',
  },
  {
    id: 'pending2', name: 'Jordan Reed', email: 'jordan@example.com', role: 'leader', status: 'pending',
    leaderId: '1', leaderName: 'Alex Rivera', sponsorId: '1', sponsorName: 'Alex Rivera',
    streak: 0, points: 0, completionRate: 0, consistency: 0, joinedAt: new Date(Date.now() - 3600000).toISOString(),
    title: 'Team Leader',
  },
  {
    id: 'pending3', name: 'Riley Washington', email: 'riley@example.com', role: 'member', status: 'pending',
    leaderId: '2', leaderName: 'Marcus Johnson', sponsorId: '1', sponsorName: 'Alex Rivera',
    streak: 0, points: 0, completionRate: 0, consistency: 0, joinedAt: new Date(Date.now() - 7200000).toISOString(),
    title: 'Go-Getter',
  },
];

const INITIAL_LEADERS: LeaderOption[] = [
  { id: '1', name: 'Alex Rivera' },
  { id: '2', name: 'Marcus Johnson' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([...MOCK_USERS, ...PENDING_SEED]);
  const [leaders, setLeaders] = useState<LeaderOption[]>(INITIAL_LEADERS);

  const pendingUsers = allUsers.filter((u) => u.status === 'pending');

  useEffect(() => {
    AsyncStorage.getItem('gg_user').then((raw) => {
      if (raw) {
        const parsed: User = JSON.parse(raw);
        setCurrentUser(parsed);
        setAllUsers((prev) => {
          if (prev.find((u) => u.id === parsed.id)) return prev;
          return [...prev, parsed];
        });
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, _password: string): Promise<User> => {
    const found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const user = found ?? MOCK_USERS[2];
    await AsyncStorage.setItem('gg_user', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }, [allUsers]);

  const register = useCallback(async (
    name: string,
    email: string,
    _password: string,
    role: UserRole,
    leaderId?: string,
    leaderName?: string,
    sponsorId?: string,
    sponsorName?: string,
    adminCode?: string,
  ): Promise<User> => {
    const isValidAdminCode = adminCode?.trim() === ADMIN_CODE;
    const finalRole: UserRole = isValidAdminCode ? 'admin' : role;
    const finalStatus: UserStatus = isValidAdminCode ? 'approved' : 'pending';

    const user: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: finalRole,
      status: finalStatus,
      streak: 0,
      points: 0,
      completionRate: 0,
      consistency: 0,
      joinedAt: new Date().toISOString(),
      title: finalRole === 'admin' ? 'Organization Owner' : finalRole === 'leader' ? 'Team Leader' : 'Go-Getter',
      leaderId,
      leaderName,
      sponsorId,
      sponsorName,
    };

    await AsyncStorage.setItem('gg_user', JSON.stringify(user));
    setCurrentUser(user);
    setAllUsers((prev) => [...prev, user]);

    if (finalRole === 'leader') {
      setLeaders((prev) => [...prev, { id: user.id, name: user.name }]);
    }

    return user;
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

  const approveUser = useCallback((id: string) => {
    setAllUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'approved' as UserStatus } : u));
    setCurrentUser((prev) => prev?.id === id ? { ...prev, status: 'approved' as UserStatus } : prev);
  }, []);

  const rejectUser = useCallback((id: string, reason: string) => {
    setAllUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'rejected' as UserStatus, rejectionReason: reason } : u));
    setCurrentUser((prev) => prev?.id === id ? { ...prev, status: 'rejected' as UserStatus, rejectionReason: reason } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, allUsers, leaders, pendingUsers, login, register, logout, updateUser, approveUser, rejectUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
