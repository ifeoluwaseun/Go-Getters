import { type ReactNode, createContext, useContext, useState, useEffect } from "react";
import { type UserRole, type UserStatus, type User } from "./types";

export interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  pendingUsers: User[];
  login: (email: string) => User | null;
  register: (name: string, email: string, role: UserRole, leaderId?: string, leaderName?: string, sponsorId?: string, sponsorName?: string, adminCode?: string) => User;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  approveUser: (id: string) => void;
  rejectUser: (id: string, reason: string) => void;
}

const ADMIN_CODE = 'GOGETTERS2024';

const MOCK_USERS: User[] = [
  { id: '1', name: 'Alex Rivera', email: 'admin@gogetters.app', role: 'admin', status: 'approved', streak: 21, points: 4820, completionRate: 97, consistency: 95, joinedAt: '2024-01-15', title: 'Organization Owner' },
  { id: '2', name: 'Marcus Johnson', email: 'leader@gogetters.app', role: 'leader', status: 'approved', leaderId: '1', leaderName: 'Alex Rivera', sponsorId: '1', sponsorName: 'Alex Rivera', streak: 14, points: 3640, completionRate: 94, consistency: 89, joinedAt: '2024-02-01', title: 'Team Leader' },
  { id: '4', name: 'Sam Chen', email: 'member@gogetters.app', role: 'member', status: 'approved', leaderId: '2', leaderName: 'Marcus Johnson', sponsorId: '2', sponsorName: 'Marcus Johnson', streak: 7, points: 2100, completionRate: 82, consistency: 77, joinedAt: '2024-03-10', title: 'Rising Star' },
];

const PENDING_SEED: User[] = [
  { id: 'p1', name: 'Taylor Morgan', email: 'taylor@example.com', role: 'member', status: 'pending', streak: 0, points: 0, completionRate: 0, consistency: 0, joinedAt: new Date().toISOString(), leaderId: '2', leaderName: 'Marcus Johnson' },
  { id: 'p2', name: 'Jordan Reed', email: 'jordan@example.com', role: 'leader', status: 'pending', streak: 0, points: 0, completionRate: 0, consistency: 0, joinedAt: new Date().toISOString(), leaderId: '1', leaderName: 'Alex Rivera' },
  { id: 'p3', name: 'Riley Washington', email: 'riley@example.com', role: 'member', status: 'pending', streak: 0, points: 0, completionRate: 0, consistency: 0, joinedAt: new Date().toISOString(), leaderId: '2', leaderName: 'Marcus Johnson' }
];

const INITIAL_ALL_USERS = [...MOCK_USERS, ...PENDING_SEED];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_ALL_USERS);

  useEffect(() => {
    const saved = localStorage.getItem('gg_user');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  const pendingUsers = allUsers.filter(u => u.status === 'pending');

  const login = (email: string) => {
    const user = allUsers.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('gg_user', JSON.stringify(user));
      return user;
    }
    return null;
  };

  const register = (name: string, email: string, role: UserRole, leaderId?: string, leaderName?: string, sponsorId?: string, sponsorName?: string, adminCode?: string) => {
    const status: UserStatus = adminCode === ADMIN_CODE ? 'approved' : 'pending';
    const finalRole = adminCode === ADMIN_CODE ? 'admin' : role;
    
    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name,
      email,
      role: finalRole,
      status,
      streak: 0,
      points: 0,
      completionRate: 0,
      consistency: 0,
      joinedAt: new Date().toISOString(),
      leaderId,
      leaderName,
      sponsorId,
      sponsorName
    };

    setAllUsers(prev => [...prev, newUser]);
    
    if (status === 'approved') {
      setCurrentUser(newUser);
      localStorage.setItem('gg_user', JSON.stringify(newUser));
    } else {
      setCurrentUser(newUser);
      localStorage.setItem('gg_user', JSON.stringify(newUser));
    }
    
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('gg_user');
    setCurrentUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('gg_user', JSON.stringify(updated));
      return updated;
    });
  };

  const approveUser = (id: string) => {
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'approved' } : u));
    if (currentUser?.id === id) {
      const updated = { ...currentUser, status: 'approved' as const };
      setCurrentUser(updated);
      localStorage.setItem('gg_user', JSON.stringify(updated));
    }
  };

  const rejectUser = (id: string, reason: string) => {
    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'rejected', rejectionReason: reason } : u));
    if (currentUser?.id === id) {
      const updated = { ...currentUser, status: 'rejected' as const, rejectionReason: reason };
      setCurrentUser(updated);
      localStorage.setItem('gg_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, allUsers, pendingUsers, login, register, logout, updateUser, approveUser, rejectUser }}>
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
