"use client";

import { type ReactNode, createContext, useContext, useState, useEffect, useCallback } from "react";
import { type UserRole, type UserStatus, type User } from "@/types";
import { supabase } from "@/lib/supabase";

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
    }
  ) => Promise<User>;
  resendOtp: (email: string, type: 'signup') => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string, reason: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  adminUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getLocalAccounts = (): Array<{ email: string; password?: string; user: User }> => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('gogetters_local_accounts') || '[]');
  } catch {
    return [];
  }
};

const saveLocalAccount = (account: { email: string; password?: string; user: User }) => {
  if (typeof window === 'undefined') return;
  const list = getLocalAccounts().filter(u => u.email.toLowerCase() !== account.email.toLowerCase());
  list.push({ ...account, email: account.email.toLowerCase() });
  localStorage.setItem('gogetters_local_accounts', JSON.stringify(list));
};

const saveActiveSession = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('gogetters_active_session', JSON.stringify(user));
  } else {
    localStorage.removeItem('gogetters_active_session');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRegData, setPendingRegData] = useState<{
    email: string;
    otpCode: string;
    profileData: {
      name: string;
      email?: string;
      password?: string;
      role: UserRole;
      leaderId?: string;
      leaderName?: string;
      sponsorId?: string;
      sponsorName?: string;
      adminCode?: string;
    };
  } | null>(null);

  // Load pending registration & local active session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPending = localStorage.getItem('gogetters_pending_reg');
      if (savedPending) {
        try {
          setPendingRegData(JSON.parse(savedPending));
        } catch (e) {
          console.error("Failed to parse pending reg data:", e);
        }
      }

      const savedSession = localStorage.getItem('gogetters_active_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.id) {
            setCurrentUser(parsed);
          }
        } catch (e) {
          console.error("Failed to parse saved session:", e);
        }
      }
    }
  }, []);

  const pendingUsers = allUsers.filter(u => u.status === 'pending');

  const refreshUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      
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

      // Merge local accounts into allUsers list
      const localAccs = getLocalAccounts().map(a => a.user);
      const combinedMap = new Map<string, User>();
      mapped.forEach(u => combinedMap.set(u.id, u));
      localAccs.forEach(u => combinedMap.set(u.id, u));

      setAllUsers(Array.from(combinedMap.values()));
    } catch (err) {
      console.error("Error refreshing users from DB, loading local accounts:", err);
      const localAccs = getLocalAccounts().map(a => a.user);
      if (localAccs.length > 0) setAllUsers(localAccs);
    }
  }, []);

  const refreshLeaders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .or('role.eq.leader,role.eq.admin');
      if (error) throw error;
      setLeaders(data || []);
    } catch (err: any) {
      console.error("Error refreshing leaders:", err?.message || err);
      // Fallback from local users
      const localLeaders = getLocalAccounts()
        .map(a => a.user)
        .filter(u => u.role === 'leader' || u.role === 'admin')
        .map(u => ({ id: u.id, name: u.name }));
      if (localLeaders.length > 0) setLeaders(localLeaders);
    }
  }, []);

  // Handle Auth Session State Change
  useEffect(() => {
    const fetchUser = async (userId: string) => {
      try {
        const { data: records, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId);
        if (error) throw error;
        
        const data = records && records.length > 0 ? records[0] : null;
        
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
          saveActiveSession(userObj);
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
    }).catch(() => setIsLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUser(session.user.id);
        await refreshLeaders();
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUsers, refreshLeaders]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (!error && data?.user) {
        const { data: records } = await supabase.from('users').select('*').eq('id', data.user.id);
        const profile = records && records.length > 0 ? records[0] : null;

        if (profile) {
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
          saveLocalAccount({ email: cleanEmail, password, user: userObj });
          saveActiveSession(userObj);
          if (userObj.role === 'admin') await refreshUsers();
          await refreshLeaders();
          return userObj;
        }
      }
    } catch (err) {
      console.warn("[AuthContext] Remote login failed/offline, checking local account store:", err);
    }

    // 2. Fallback to local accounts store
    const localAccounts = getLocalAccounts();
    const match = localAccounts.find(acc => acc.email.toLowerCase() === cleanEmail);

    if (match) {
      if (match.password && match.password !== password) {
        throw new Error("Invalid password");
      }
      setCurrentUser(match.user);
      saveActiveSession(match.user);
      await refreshLeaders();
      return match.user;
    }

    throw new Error("Invalid email or password. Please check your credentials.");
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
    adminCode?: string
  ): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if account already exists locally
    const existing = getLocalAccounts().find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error("An account with this email address already exists. Please sign in instead.");
    }

    if (role === 'admin') {
      if (adminCode !== 'GOGETTERS2024') {
        throw new Error("Invalid admin setup code");
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    let authUserId = "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
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
        console.warn("[AuthContext] Supabase signUp returned error:", error.message);
      } else if (data?.user) {
        authUserId = data.user.id;
      }
    } catch (err: any) {
      console.warn("[AuthContext] Supabase auth network error (proceeding with local registration flow):", err?.message || err);
    }

    // Save registration info in state/localStorage for verification step
    const profileData = {
      name,
      email: cleanEmail,
      password,
      role,
      leaderId: leaderId || undefined,
      leaderName: leaderName || undefined,
      sponsorId: sponsorId || undefined,
      sponsorName: sponsorName || undefined,
      adminCode: adminCode || undefined,
    };
    
    const regState = { email: cleanEmail, otpCode, profileData };
    setPendingRegData(regState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gogetters_pending_reg', JSON.stringify(regState));
    }

    // Send the branded OTP email via Next.js API (non-blocking for registration flow)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, name, code: otpCode }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[AuthContext] Failed to send initial signup OTP:", errData.error || res.statusText);
      }
    } catch (sendErr) {
      console.error("[AuthContext] Error sending initial signup OTP:", sendErr);
    }

    const userObj: User = {
      id: authUserId,
      name,
      email: cleanEmail,
      role,
      status: 'unconfirmed',
      streak: 0,
      points: 0,
      completionRate: 0,
      consistency: 0,
      joinedAt: new Date().toISOString(),
    };
    
    return userObj;
  }, []);

  const verifyAndCompleteRegister = useCallback(async (
    email: string,
    code: string,
    profileData: {
      name: string;
      email?: string;
      password?: string;
      role: UserRole;
      leaderId?: string;
      leaderName?: string;
      sponsorId?: string;
      sponsorName?: string;
      adminCode?: string;
    }
  ): Promise<User> => {
    let currentRegState = pendingRegData;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gogetters_pending_reg');
      if (saved) {
        try {
          currentRegState = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (!currentRegState && currentUser && currentUser.status === "unconfirmed") {
      currentRegState = {
        email: currentUser.email,
        otpCode: "",
        profileData: {
          name: currentUser.name || "New User",
          email: currentUser.email,
          role: currentUser.role || "member",
          sponsorId: currentUser.sponsorId,
          sponsorName: currentUser.sponsorName,
        }
      };
    }

    if (!currentRegState || currentRegState.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("No pending registration found for this email address");
    }

    let userId = currentUser?.id;
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) userId = authUser.id;
    } catch (e) {
      console.warn("[AuthContext] Could not fetch remote session, checking local OTP:", e);
    }

    if (currentRegState.otpCode && currentRegState.otpCode !== code) {
      throw new Error("Invalid verification code. Please check your email for the correct code.");
    }

    if (!userId) {
      userId = "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    const { name, role, leaderId, leaderName, sponsorId, sponsorName, adminCode, password } = profileData;
    const statusVal = (role === 'admin' || adminCode === 'GOGETTERS2024') ? 'approved' : 'pending';
    
    const dbProfile = {
      id: userId,
      name,
      email: email.toLowerCase(),
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
      if (insertErr) console.warn("[AuthContext] Database insert returned:", insertErr.message);
    } catch (dbErr) {
      console.warn("[AuthContext] Supabase DB offline or unreachable during insert:", dbErr);
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

    // Save account locally & set active session
    saveLocalAccount({ email: userObj.email, password: password || currentRegState.profileData?.password, user: userObj });
    saveActiveSession(userObj);

    setPendingRegData(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gogetters_pending_reg');
    }

    setCurrentUser(userObj);
    if (userObj.role === 'admin') await refreshUsers();
    await refreshLeaders();
    return userObj;
  }, [pendingRegData, currentUser, refreshUsers, refreshLeaders]);

    // Clear local storage pending registration
    setPendingRegData(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gogetters_pending_reg');
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
    if (userObj.role === 'admin') await refreshUsers();
    await refreshLeaders();
    return userObj;
  }, [pendingRegData, currentUser, refreshUsers, refreshLeaders]);

  const resendOtp = useCallback(async (email: string, type: 'signup'): Promise<void> => {
    let currentRegData = pendingRegData;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gogetters_pending_reg');
      if (saved) {
        try {
          currentRegData = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // If no local storage registration data, construct it from the active unconfirmed user session!
    if (!currentRegData && currentUser && currentUser.status === "unconfirmed") {
      currentRegData = {
        email: currentUser.email,
        otpCode: "",
        profileData: {
          name: currentUser.name || "New User",
          role: currentUser.role || "member",
          sponsorId: currentUser.sponsorId,
          sponsorName: currentUser.sponsorName,
        }
      };
    }

    if (!currentRegData || currentRegData.email !== email) {
      throw new Error("No pending registration found for this email address");
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const updatedState = { ...currentRegData, otpCode: newCode };
    setPendingRegData(updatedState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gogetters_pending_reg', JSON.stringify(updatedState));
    }

    // Update custom metadata on the authenticated user record in Supabase Auth!
    try {
      await supabase.auth.updateUser({
        data: {
          otp_code: newCode,
          otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }
      });
    } catch (metaErr) {
      console.error("Failed to update OTP metadata in Supabase:", metaErr);
    }

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: currentRegData.profileData.name, code: newCode }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to deliver confirmation email code.");
    }
  }, [pendingRegData, currentUser]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Signout error:", error);
    }
    saveActiveSession(null);
    setCurrentUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    
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
  }, [currentUser]);

  const approveUser = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', id);
      if (error) console.warn("Supabase update error:", error.message);
    } catch (e) {
      console.warn("Supabase DB offline during approval:", e);
    }

    // Update in local accounts registry
    const localAccounts = getLocalAccounts();
    const acc = localAccounts.find(a => a.user.id === id);
    if (acc) {
      acc.user.status = 'approved';
      saveLocalAccount(acc);
    }

    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'approved' } : u));
    if (currentUser?.id === id) {
      const updated = { ...currentUser, status: 'approved' as const };
      setCurrentUser(updated);
      saveActiveSession(updated);
    }
  }, [currentUser]);

  const rejectUser = useCallback(async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', id);
      if (error) console.warn("Supabase rejection error:", error.message);
    } catch (e) {
      console.warn("Supabase DB offline during rejection:", e);
    }

    // Update in local accounts registry
    const localAccounts = getLocalAccounts();
    const acc = localAccounts.find(a => a.user.id === id);
    if (acc) {
      acc.user.status = 'rejected';
      acc.user.rejectionReason = reason;
      saveLocalAccount(acc);
    }

    setAllUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'rejected', rejectionReason: reason } : u));
    if (currentUser?.id === id) {
      const updated = { ...currentUser, status: 'rejected' as const, rejectionReason: reason };
      setCurrentUser(updated);
      saveActiveSession(updated);
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

    try {
      const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId);
      if (error) console.warn("Supabase admin update error:", error.message);
    } catch (e) {
      console.warn("Supabase DB offline during admin user update:", e);
    }

    // Update in local accounts registry
    const localAccounts = getLocalAccounts();
    const acc = localAccounts.find(a => a.user.id === userId);
    if (acc) {
      acc.user = { ...acc.user, ...updates };
      saveLocalAccount(acc);
    }

    const partialUpdate = { ...updates };
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...partialUpdate } : u));
    if (currentUser?.id === userId) {
      const updated = { ...currentUser, ...partialUpdate };
      setCurrentUser(updated);
      saveActiveSession(updated);
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser, isLoading, allUsers, pendingUsers, leaders,
      login, register, verifyAndCompleteRegister, resendOtp, logout, updateUser, approveUser, rejectUser, refreshUsers, adminUpdateUser
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
