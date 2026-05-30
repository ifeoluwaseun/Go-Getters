"use client";

import { type ReactNode, createContext, useContext, useState, useEffect, useCallback } from "react";
import { type UserRole, type UserStatus, type User } from "@/types";
import { createClient } from "@/lib/supabase/client";

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  allUsers: User[];
  pendingUsers: User[];
  leaders: { id: string; name: string }[];
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
    adminCode?: string
  ) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string, reason: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  adminUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();
  const pendingUsers = allUsers.filter(u => u.status === 'pending');

  const refreshUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      
      // Map columns correctly: leader_id -> leaderId, joined_at -> joinedAt, etc.
      const mapped = (data || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as UserRole,
        status: u.status as UserStatus,
        streak: u.streak,
        points: u.points,
        completionRate: u.completion_rate,
        consistency: u.consistency,
        joinedAt: u.joined_at,
        title: u.title,
        leaderId: u.leader_id,
        leaderName: u.leader_name,
        sponsorId: u.sponsor_id,
        sponsorName: u.sponsor_name,
        rejectionReason: u.rejection_reason,
      }));
      setAllUsers(mapped);
    } catch (err) {
      console.error("Error refreshing users:", err);
    }
  }, [supabase]);

  const refreshLeaders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .or('role.eq.leader,role.eq.admin');
      if (error) throw error;
      setLeaders(data || []);
    } catch (err) {
      console.error("Error refreshing leaders:", err);
    }
  }, [supabase]);

  // Handle Auth Session State Change
  useEffect(() => {
    const fetchUser = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) throw error;
        
        if (data) {
          const userObj: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            status: data.status as UserStatus,
            streak: data.streak,
            points: data.points,
            completionRate: data.completion_rate,
            consistency: data.consistency,
            joinedAt: data.joined_at,
            title: data.title,
            leaderId: data.leader_id,
            leaderName: data.leader_name,
            sponsorId: data.sponsor_id,
            sponsorName: data.sponsor_name,
            rejectionReason: data.rejection_reason,
          };
          setCurrentUser(userObj);
          if (userObj.role === 'admin') await refreshUsers();
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUser(session.user.id);
      } else {
        setCurrentUser(null);
        setAllUsers([]);
        setIsLoading(false);
      }
      await refreshLeaders();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshUsers, refreshLeaders]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned");

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (profileErr) throw profileErr;

    const userObj: User = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role as UserRole,
      status: profile.status as UserStatus,
      streak: profile.streak,
      points: profile.points,
      completionRate: profile.completion_rate,
      consistency: profile.consistency,
      joinedAt: profile.joined_at,
      title: profile.title,
      leaderId: profile.leader_id,
      leaderName: profile.leader_name,
      sponsorId: profile.sponsor_id,
      sponsorName: profile.sponsor_name,
      rejectionReason: profile.rejection_reason,
    };

    setCurrentUser(userObj);
    if (userObj.role === 'admin') await refreshUsers();
    await refreshLeaders();
    return userObj;
  }, [supabase, refreshUsers, refreshLeaders]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    leaderId?: string,
    leaderName?: string,
    sponsorId?: string,
    sponsorName?: string,
    adminCode?: string
  ): Promise<User> => {
    if (role === 'admin') {
      if (adminCode !== 'GOGETTERS2024') {
        throw new Error("Invalid admin setup code");
      }

      // Check if an Admin already exists in the database
      const { data: existingAdmins, error: checkErr } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (checkErr) {
        console.error("Failed to verify existing admins:", checkErr);
      } else if (existingAdmins && existingAdmins.length > 0) {
        throw new Error("Admin registration is closed. An Administrator already exists.");
      }
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Registration failed");

    // Insert user into custom public.users table
    const statusVal = (role === 'admin' || adminCode === 'GOGETTERS2024') ? 'approved' : 'pending';
    const profileData = {
      id: data.user.id,
      name,
      email,
      role,
      status: statusVal,
      streak: 0,
      points: 0,
      completion_rate: 0,
      consistency: 0,
      joined_at: new Date().toISOString(),
      leader_id: leaderId || null,
      leader_name: leaderName || null,
      sponsor_id: sponsorId || null,
      sponsor_name: sponsorName || null,
    };

    const { error: insertErr } = await supabase.from('users').insert(profileData);
    if (insertErr) throw insertErr;

    // Notify organization owner/admins of the new registration
    try {
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');
      
      if (admins && admins.length > 0) {
        const notificationsToInsert = admins.map(admin => ({
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          user_id: admin.id,
          type: 'announcement',
          title: 'New Registration',
          body: `${name} has registered. Please assign a team leader.`,
          is_read: false,
          level: 2,
          created_at: new Date().toISOString(),
        }));
        await supabase.from('notifications').insert(notificationsToInsert);
      }
    } catch (notifErr) {
      console.error("Failed to notify admins of new registration:", notifErr);
    }

    const userObj: User = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
      role: profileData.role as UserRole,
      status: profileData.status as UserStatus,
      streak: 0,
      points: 0,
      completionRate: 0,
      consistency: 0,
      joinedAt: profileData.joined_at,
      leaderId: profileData.leader_id || undefined,
      leaderName: profileData.leader_name || undefined,
      sponsorId: profileData.sponsor_id || undefined,
      sponsorName: profileData.sponsor_name || undefined,
    };

    setCurrentUser(userObj);
    await refreshLeaders();
    return userObj;
  }, [supabase, refreshLeaders]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Signout error:", error);
    setCurrentUser(null);
    setAllUsers([]);
  }, [supabase]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    
    // Map object camelCase keys to snake_case for DB columns
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.points !== undefined) dbUpdates.points = updates.points;
    if (updates.completionRate !== undefined) dbUpdates.completion_rate = updates.completionRate;
    if (updates.consistency !== undefined) dbUpdates.consistency = updates.consistency;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.leaderId !== undefined) dbUpdates.leader_id = updates.leaderId;
    if (updates.leaderName !== undefined) dbUpdates.leader_name = updates.leaderName;
    if (updates.sponsorId !== undefined) dbUpdates.sponsor_id = updates.sponsorId;
    if (updates.sponsorName !== undefined) dbUpdates.sponsor_name = updates.sponsorName;
    if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;

    const { error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', currentUser.id);

    if (error) throw error;

    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  }, [currentUser, supabase]);

  const approveUser = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) throw error;

    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'approved' } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, status: 'approved' } : null);
    }
  }, [currentUser, supabase]);

  const rejectUser = useCallback(async (id: string, reason: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);

    if (error) throw error;

    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'rejected', rejectionReason: reason } : u));
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, status: 'rejected', rejectionReason: reason } : null);
    }
  }, [currentUser, supabase]);

  const adminUpdateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.points !== undefined) dbUpdates.points = updates.points;
    if (updates.completionRate !== undefined) dbUpdates.completion_rate = updates.completionRate;
    if (updates.consistency !== undefined) dbUpdates.consistency = updates.consistency;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.leaderId !== undefined) dbUpdates.leader_id = updates.leaderId;
    if (updates.leaderName !== undefined) dbUpdates.leader_name = updates.leaderName;
    if (updates.sponsorId !== undefined) dbUpdates.sponsor_id = updates.sponsorId;
    if (updates.sponsorName !== undefined) dbUpdates.sponsor_name = updates.sponsorName;
    if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;

    const { error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) throw error;

    const partialUpdate = { ...updates };
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...partialUpdate } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...partialUpdate } : null);
    }
  }, [currentUser, supabase]);

  return (
    <AuthContext.Provider value={{
      currentUser, isLoading, allUsers, pendingUsers, leaders,
      login, register, logout, updateUser, approveUser, rejectUser, refreshUsers, adminUpdateUser
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
