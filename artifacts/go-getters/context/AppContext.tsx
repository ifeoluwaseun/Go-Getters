import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { Task, Goal, Post, Meeting, Achievement, AppNotification, LeaderboardUser, WeeklyAchiever, Evidence, TeamMember, TeamMessage } from '@/types';
import { api } from '@/lib/api';

interface AppContextType {
  tasks: Task[];
  goals: Goal[];
  posts: Post[];
  leaderboard: LeaderboardUser[];
  meetings: Meeting[];
  notifications: AppNotification[];
  achievements: Achievement[];
  achievers: WeeklyAchiever[];
  evidence: Evidence[];
  teamMembers: TeamMember[];
  teamMessages: Record<string, TeamMessage[]>;
  unreadCount: number;
  isLoading: boolean;
  completeTask: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  addPost: (content: string, type: Post['type']) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addEvidence: (ev: Omit<Evidence, 'id'>) => Promise<void>;
  approveEvidence: (id: string) => Promise<void>;
  rejectEvidence: (id: string, feedback: string) => Promise<void>;
  sendTeamMessage: (memberId: string, content: string, senderId: string, senderName: string, type?: TeamMessage['type']) => Promise<void>;
  loadTeamMembers: () => Promise<void>;
  loadTeamMessages: (memberId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievers, setAchievers] = useState<WeeklyAchiever[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamMessages, setTeamMessages] = useState<Record<string, TeamMessage[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    Promise.allSettled([
      api.get<{ tasks: Task[] }>('/tasks').then(r => setTasks(r.tasks)),
      api.get<{ goals: Goal[] }>('/goals').then(r => setGoals(r.goals)),
      api.get<{ posts: Post[] }>('/posts').then(r => setPosts(r.posts)),
      api.get<{ leaderboard: LeaderboardUser[] }>('/leaderboard').then(r => setLeaderboard(r.leaderboard)),
      api.get<{ meetings: Meeting[] }>('/meetings').then(r => setMeetings(r.meetings)),
      api.get<{ notifications: AppNotification[] }>('/notifications').then(r => setNotifications(r.notifications)),
      api.get<{ achievements: Achievement[] }>('/achievements').then(r => setAchievements(r.achievements)),
      api.get<{ achievers: WeeklyAchiever[] }>('/achievements/achievers').then(r => setAchievers(r.achievers)),
      api.get<{ evidence: Evidence[] }>('/evidence').then(r => setEvidence(r.evidence)),
    ]).finally(() => setIsLoading(false));
  }, [userId]);

  const completeTask = useCallback(async (id: string) => {
    const completedAt = new Date().toISOString();
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: 'completed' as const, completedAt } : t));
    await api.patch(`/tasks/${id}`, { status: 'completed', completedAt });
    // Refresh goals so progress percentages update
    try {
      const { goals: updatedGoals } = await api.get<{ goals: Goal[] }>('/goals');
      setGoals(updatedGoals);
    } catch {}
  }, []);

  const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
    const { task: newTask } = await api.post<{ task: Task }>('/tasks', task);
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id'>) => {
    const { goal: newGoal } = await api.post<{ goal: Goal }>('/goals', goal);
    setGoals((prev) => [...prev, newGoal]);
  }, []);

  const likePost = useCallback(async (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
    await api.post(`/posts/${id}/like`);
  }, []);

  const addPost = useCallback(async (content: string, type: Post['type']) => {
    const { post } = await api.post<{ post: Post }>('/posts', { content, type });
    setPosts((prev) => [post, ...prev]);
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await api.post(`/notifications/${id}/read`);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await api.post('/notifications/read-all');
  }, []);

  const addEvidence = useCallback(async (ev: Omit<Evidence, 'id'>) => {
    const { evidence: newEv } = await api.post<{ evidence: Evidence }>('/evidence', ev);
    setEvidence((prev) => [newEv, ...prev]);
    setTasks((prev) => prev.map((t) => t.id === ev.taskId ? { ...t, hasEvidence: true } : t));
  }, []);

  const approveEvidence = useCallback(async (id: string) => {
    const { evidence: updated } = await api.post<{ evidence: Evidence }>(`/evidence/${id}/approve`);
    setEvidence((prev) => prev.map((e) => e.id === id ? updated : e));
  }, []);

  const rejectEvidence = useCallback(async (id: string, feedback: string) => {
    const { evidence: updated } = await api.post<{ evidence: Evidence }>(`/evidence/${id}/reject`, { feedback });
    setEvidence((prev) => prev.map((e) => e.id === id ? updated : e));
  }, []);

  const loadTeamMembers = useCallback(async () => {
    try {
      const { members } = await api.get<{ members: TeamMember[] }>('/team');
      setTeamMembers(members);
    } catch {}
  }, []);

  const loadTeamMessages = useCallback(async (memberId: string) => {
    try {
      const { messages } = await api.get<{ messages: TeamMessage[] }>(`/team/${memberId}/messages`);
      setTeamMessages((prev) => ({ ...prev, [memberId]: messages }));
    } catch {}
  }, []);

  const sendTeamMessage = useCallback(async (memberId: string, content: string, _senderId: string, _senderName: string, type: TeamMessage['type'] = 'message') => {
    const { message } = await api.post<{ message: TeamMessage }>(`/team/${memberId}/messages`, { content, type });
    setTeamMessages((prev) => ({
      ...prev,
      [memberId]: [...(prev[memberId] ?? []), message],
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      tasks, goals, posts, leaderboard, meetings, notifications, achievements, achievers,
      evidence, teamMembers, teamMessages, unreadCount, isLoading,
      completeTask, addTask, addGoal, likePost, addPost,
      markNotificationRead, markAllRead, addEvidence, approveEvidence, rejectEvidence,
      sendTeamMessage, loadTeamMembers, loadTeamMessages,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
