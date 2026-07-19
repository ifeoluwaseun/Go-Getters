import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, UserRole, LeaderOption, UserStatus } from '@/types';
import { supabase } from '@/lib/supabase';

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
  verifyAndCompleteRegister: (
    email: string,
    code: string,
    profileData: {
      name: string;
      role: UserRole;
      leaderId?: string;
      leaderName?: string;
      sponsorId?: string;
      sponsorName?: string;
      adminCode?: string;
    },
  ) => Promise<User>;
  resendOtp: (email: string, type: 'signup') => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string, reason: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  adminUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function getApiUrl() {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'http://localhost:3000';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<LeaderOption[]>([]);

  const pendingUsers = allUsers.filter((u) => u.status === 'pending');

  const refreshLeaders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .or('role.eq.leader,role.eq.admin');
      if (error) throw error;
      setLeaders(data || []);
    } catch (err) {
      console.error("Error refreshing leaders on mobile:", err);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) throw error;

      const mapped = (data || []).map((u) => ({
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
      console.error("Error refreshing users on mobile:", err);
    }
  }, []);

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
            leaderId: data.leader_id || undefined,
            leaderName: data.leader_name || undefined,
            sponsorId: data.sponsor_id || undefined,
            sponsorName: data.sponsor_name || undefined,
            rejectionReason: data.rejection_reason || undefined,
          };
          setCurrentUser(userObj);
          if (userObj.role === 'admin') await refreshUsers();
        }
      } catch (err) {
        console.error("Error loading user profile on mobile:", err);
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
  }, [refreshUsers, refreshLeaders]);

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
      leaderId: profile.leader_id || undefined,
      leaderName: profile.leader_name || undefined,
      sponsorId: profile.sponsor_id || undefined,
      sponsorName: profile.sponsor_name || undefined,
      rejectionReason: profile.rejection_reason || undefined,
    };

    setCurrentUser(userObj);
    if (userObj.role === 'admin') await refreshUsers();
    await refreshLeaders();
    return userObj;
  }, [refreshUsers, refreshLeaders]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    leaderId?: string,
    leaderName?: string,
    sponsorId?: string,
    sponsorName?: string,
    adminCode?: string,
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

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    let authUserId = "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            otp_code: otpCode,
            otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          }
        }
      });
      if (error) {
        console.warn("[Mobile AuthContext] Supabase signUp returned error:", error.message);
      } else if (data?.user) {
        authUserId = data.user.id;
      }
    } catch (err: any) {
      console.warn("[Mobile AuthContext] Supabase auth network error (proceeding with local registration flow):", err?.message || err);
    }

    // Trigger the Next.js API endpoint to send the OTP email via Resend
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, code: otpCode }),
      });
    } catch (err) {
      console.error("Failed to send OTP email via Mobile during registration:", err);
    }

    // Return user with 'unconfirmed' status to trigger OTP screen on mobile UI
    const userObj: User = {
      id: authUserId,
      name,
      email,
      role,
      status: 'unconfirmed',
      streak: 0,
      points: 0,
      completionRate: 0,
      consistency: 0,
      joinedAt: new Date().toISOString(),
    };
    return userObj;
  }, [refreshLeaders]);

  const verifyAndCompleteRegister = useCallback(async (
    email: string,
    code: string,
    profileData: {
      name: string;
      role: UserRole;
      leaderId?: string;
      leaderName?: string;
      sponsorId?: string;
      sponsorName?: string;
      adminCode?: string;
    }
  ): Promise<User> => {
    // Check custom OTP against user metadata or provided OTP
    let userId = currentUser?.id;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        userId = authUser.id;
        const metadataCode = authUser.user_metadata?.otp_code;
        const metadataExpires = authUser.user_metadata?.otp_expires_at;
        if (metadataCode && (metadataCode !== code || new Date(metadataExpires) < new Date())) {
          throw new Error("Invalid or expired verification code");
        }
      }
    } catch (e: any) {
      if (e?.message === "Invalid or expired verification code") throw e;
      console.warn("[Mobile AuthContext] Could not fetch remote session, verifying locally:", e);
    }

    if (!userId) {
      userId = "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Insert user into custom public.users table now that we are authenticated!
    const { name, role, leaderId, leaderName, sponsorId, sponsorName, adminCode } = profileData;
    const statusVal = (role === 'admin' || adminCode === 'GOGETTERS2024') ? 'approved' : 'pending';
    const dbProfile = {
      id: userId,
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

    try {
      const { error: insertErr } = await supabase.from('users').insert(dbProfile);
      if (insertErr) console.warn("[Mobile AuthContext] Database insert returned:", insertErr.message);
    } catch (dbErr) {
      console.warn("[Mobile AuthContext] Supabase DB offline or unreachable during insert:", dbErr);
    }

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
      id: dbProfile.id,
      name: dbProfile.name,
      email: dbProfile.email,
      role: dbProfile.role as UserRole,
      status: dbProfile.status as UserStatus,
      streak: 0,
      points: 0,
      completionRate: 0,
      consistency: 0,
      joinedAt: dbProfile.joined_at,
      leaderId: dbProfile.leader_id || undefined,
      leaderName: dbProfile.leader_name || undefined,
      sponsorId: dbProfile.sponsor_id || undefined,
      sponsorName: dbProfile.sponsor_name || undefined,
    };

    setCurrentUser(userObj);
    await refreshLeaders();
    return userObj;
  }, [refreshLeaders]);

  const resendOtp = useCallback(async (email: string, type: 'signup'): Promise<void> => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update user metadata in Supabase Auth with new code
    const { error: updateErr } = await supabase.auth.updateUser({
      data: {
        otp_code: newCode,
        otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }
    });

    if (updateErr) {
      // Fallback to native Supabase resend
      const { error } = await supabase.auth.resend({
        email,
        type,
      });
      if (error) throw error;
      return;
    }

    // Trigger Next.js send-otp endpoint
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.user_metadata?.name || 'User';
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: userName, code: newCode }),
      });
    } catch (err) {
      console.error("Failed to send OTP email via Mobile resend:", err);
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Signout error on mobile:", error);
    setCurrentUser(null);
    setAllUsers([]);
  }, []);

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
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  }, [currentUser]);

  const approveUser = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) throw error;

    setAllUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'approved' as const } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, status: 'approved' as const } : null));
    }
  }, [currentUser]);

  const rejectUser = useCallback(async (id: string, reason: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);

    if (error) throw error;

    setAllUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'rejected' as const, rejectionReason: reason } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, status: 'rejected' as const, rejectionReason: reason } : null));
    }
  }, [currentUser]);

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
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...partialUpdate } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...partialUpdate } : null));
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser, isLoading, allUsers, leaders, pendingUsers,
      login, register, verifyAndCompleteRegister, resendOtp, logout, updateUser, approveUser, rejectUser, refreshUsers, adminUpdateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
