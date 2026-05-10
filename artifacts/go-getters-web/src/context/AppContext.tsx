import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Task, Goal, Post, Meeting, Achievement, AppNotification,
  LeaderboardUser, WeeklyAchiever, Evidence, TeamMember, TeamMessage
} from './types';
import { api } from '../lib/api';

export interface AppContextType {
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
  loadTeamMessages: (memberId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children, userId }: { children: ReactNode; userId?: string }) {
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const refreshAll = useCallback(async () => {
    if (!userId) return;
    try {
      const [
        tasksRes, goalsRes, postsRes, lbRes, meetingsRes,
        notifsRes, achRes, achieversRes, evRes
      ] = await Promise.allSettled([
        api.get<{ tasks: Task[] }>('/tasks'),
        api.get<{ goals: Goal[] }>('/goals'),
        api.get<{ posts: Post[] }>('/posts'),
        api.get<{ leaderboard: LeaderboardUser[] }>('/leaderboard'),
        api.get<{ meetings: Meeting[] }>('/meetings'),
        api.get<{ notifications: AppNotification[] }>('/notifications'),
        api.get<{ achievements: Achievement[] }>('/achievements'),
        api.get<{ achievers: WeeklyAchiever[] }>('/achievements/achievers'),
        api.get<{ evidence: Evidence[] }>('/evidence'),
      ]);

      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.tasks);
      if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value.goals);
      if (postsRes.status === 'fulfilled') setPosts(postsRes.value.posts);
      if (lbRes.status === 'fulfilled') setLeaderboard(lbRes.value.leaderboard);
      if (meetingsRes.status === 'fulfilled') setMeetings(meetingsRes.value.meetings);
      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value.notifications);
      if (achRes.status === 'fulfilled') setAchievements(achRes.value.achievements);
      if (achieversRes.status === 'fulfilled') setAchievers(achieversRes.value.achievers);
      if (evRes.status === 'fulfilled') setEvidence(evRes.value.evidence);
    } catch {}
  }, [userId]);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    refreshAll().finally(() => setIsLoading(false));
  }, [userId, refreshAll]);

  const completeTask = useCallback(async (id: string) => {
    const completedAt = new Date().toISOString();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed', completedAt } : t));
    await api.patch(`/tasks/${id}`, { status: 'completed', completedAt });
  }, []);

  const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
    const { task: newTask } = await api.post<{ task: Task }>('/tasks', task);
    setTasks(prev => [...prev, newTask]);
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id'>) => {
    const { goal: newGoal } = await api.post<{ goal: Goal }>('/goals', goal);
    setGoals(prev => [...prev, newGoal]);
  }, []);

  const likePost = useCallback(async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
      : p
    ));
    await api.post(`/posts/${id}/like`);
  }, []);

  const addPost = useCallback(async (content: string, type: Post['type']) => {
    const { post } = await api.post<{ post: Post }>('/posts', { content, type });
    setPosts(prev => [post, ...prev]);
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await api.post(`/notifications/${id}/read`);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await api.post('/notifications/read-all');
  }, []);

  const addEvidence = useCallback(async (ev: Omit<Evidence, 'id'>) => {
    const { evidence: newEv } = await api.post<{ evidence: Evidence }>('/evidence', ev);
    setEvidence(prev => [newEv, ...prev]);
    setTasks(prev => prev.map(t => t.id === ev.taskId ? { ...t, hasEvidence: true } : t));
  }, []);

  const approveEvidence = useCallback(async (id: string) => {
    const { evidence: updated } = await api.post<{ evidence: Evidence }>(`/evidence/${id}/approve`);
    setEvidence(prev => prev.map(e => e.id === id ? updated : e));
  }, []);

  const rejectEvidence = useCallback(async (id: string, feedback: string) => {
    const { evidence: updated } = await api.post<{ evidence: Evidence }>(`/evidence/${id}/reject`, { feedback });
    setEvidence(prev => prev.map(e => e.id === id ? updated : e));
  }, []);

  const loadTeamMessages = useCallback(async (memberId: string) => {
    try {
      const { messages } = await api.get<{ messages: TeamMessage[] }>(`/team/${memberId}/messages`);
      setTeamMessages(prev => ({ ...prev, [memberId]: messages }));
    } catch {}
  }, []);

  const sendTeamMessage = useCallback(async (memberId: string, content: string, _senderId: string, _senderName: string, type: TeamMessage['type'] = 'message') => {
    const { message } = await api.post<{ message: TeamMessage }>(`/team/${memberId}/messages`, { content, type });
    setTeamMessages(prev => ({
      ...prev,
      [memberId]: [...(prev[memberId] ?? []), message],
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      tasks, goals, posts, leaderboard, meetings, notifications, achievements, achievers,
      evidence, teamMembers, teamMessages, unreadCount, isLoading,
      completeTask, addTask, addGoal, likePost, addPost, markNotificationRead, markAllRead,
      addEvidence, approveEvidence, rejectEvidence, sendTeamMessage, loadTeamMessages, refreshAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
