import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import {
  Task, Goal, Post, Meeting, Achievement, AppNotification,
  LeaderboardUser, WeeklyAchiever, Evidence, TeamMember, TeamMessage
} from '@/types';
import { supabase } from '@/lib/supabase';

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

  const refreshAll = useCallback(async () => {
    if (!userId) return;
    try {
      const tasksPromise = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      const goalsPromise = supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      const postsPromise = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      const postLikesPromise = supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId);

      const meetingsPromise = supabase
        .from('meetings')
        .select('*')
        .order('start_time', { ascending: true });

      const notifsPromise = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const achPromise = supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId);

      const achieversPromise = supabase
        .from('users')
        .select('*')
        .eq('status', 'approved')
        .gt('points', 0)
        .order('points', { ascending: false });

      const evidencePromise = supabase
        .from('evidence')
        .select('*')
        .order('created_at', { ascending: false });

      const teamPromise = supabase
        .from('users')
        .select('*')
        .eq('status', 'approved');

      const [
        tasksRes, goalsRes, postsRes, likesRes, meetingsRes,
        notifsRes, achRes, achieversRes, evRes, teamRes
      ] = await Promise.all([
        tasksPromise, goalsPromise, postsPromise, postLikesPromise, meetingsPromise,
        notifsPromise, achPromise, achieversPromise, evidencePromise, teamPromise
      ]);

      if (tasksRes.data) {
        setTasks(tasksRes.data.map((t) => ({
          id: t.id,
          goalId: t.goal_id || undefined,
          title: t.title,
          description: t.description || undefined,
          category: t.category,
          dueTime: t.due_time || undefined,
          priority: t.priority as any,
          status: t.status as any,
          hasEvidence: t.has_evidence,
          recurring: t.recurring,
          notes: t.notes || undefined,
          date: t.date,
          completedAt: t.completed_at || undefined,
        })));
      }

      if (goalsRes.data) {
        setGoals(goalsRes.data.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          weekStart: g.week_start,
          category: g.category,
          progress: g.progress,
          color: g.color,
          taskIds: [],
        })));
      }

      const likedPostIds = new Set((likesRes.data || []).map((l) => l.post_id));
      if (postsRes.data) {
        setPosts(postsRes.data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.user_name,
          userRole: p.user_role as any,
          content: p.content,
          type: p.type as any,
          likes: p.likes,
          comments: p.comments,
          liked: likedPostIds.has(p.id),
          createdAt: p.created_at || new Date().toISOString(),
        })));
      }

      if (achieversRes.data) {
        const lbMapped: LeaderboardUser[] = achieversRes.data.map((u, i) => ({
          id: u.id,
          name: u.name,
          role: u.role as any,
          points: u.points,
          streak: u.streak,
          completionRate: u.completion_rate,
          rank: i + 1,
          change: 'same',
        }));
        setLeaderboard(lbMapped);

        setAchievers(achieversRes.data.map((u) => ({
          id: u.id,
          userId: u.id,
          userName: u.name,
          userRole: u.role as any,
          title: u.title || "Weekly Champ",
          badge: u.points > 100 ? "Elite" : "Challenger",
          completionRate: u.completion_rate,
          streak: u.streak,
          points: u.points,
          weekStart: new Date().toISOString(),
          category: "General",
        })));
      }

      if (meetingsRes.data) {
        setMeetings(meetingsRes.data.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          startTime: m.start_time,
          endTime: m.end_time,
          link: m.link,
          type: m.type as any,
          host: m.host,
        })));
      }

      if (notifsRes.data) {
        setNotifications(notifsRes.data.map((n) => ({
          id: n.id,
          type: n.type as any,
          title: n.title,
          body: n.body,
          isRead: n.is_read,
          level: n.level as any,
          createdAt: n.created_at,
        })));
      }

      if (achRes.data) {
        setAchievements(achRes.data.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          icon: a.icon,
          earnedAt: a.earned_at,
          color: a.color,
        })));
      }

      if (evRes.data) {
        setEvidence(evRes.data.map((e) => ({
          id: e.id,
          taskId: e.task_id,
          taskTitle: e.task_title,
          type: e.type as any,
          uri: e.uri || undefined,
          link: e.link || undefined,
          description: e.description,
          status: e.status as any,
          feedback: e.feedback || undefined,
          uploadedAt: e.uploaded_at,
          userName: e.user_name,
        })));
      }

      if (teamRes.data) {
        setTeamMembers(teamRes.data.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
          role: t.role as any,
          streak: t.streak,
          points: t.points,
          completionRate: t.completion_rate,
          consistency: t.consistency,
          joinedAt: t.joined_at,
          title: t.title || undefined,
          leaderId: t.leader_id || "",
          sponsorId: t.sponsor_id || undefined,
          lastActive: t.joined_at || new Date().toISOString(),
          status: (t.completion_rate >= 80 ? 'active' : t.completion_rate >= 50 ? 'at-risk' : 'inactive') as any,
          tasks: [],
          goals: [],
          evidence: [],
        })));
      }
    } catch (err) {
      console.error("Error loading Supabase AppContext on mobile:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    refreshAll().finally(() => setIsLoading(false));
  }, [userId, refreshAll]);

  const updateGoalProgress = async (goalId: string, currentTasks: Task[]) => {
    const goalTasks = currentTasks.filter((t) => t.goalId === goalId);
    if (goalTasks.length === 0) return;
    const completedCount = goalTasks.filter((t) => t.status === 'completed').length;
    const newProgress = Math.round((completedCount / goalTasks.length) * 100);

    await supabase
      .from('goals')
      .update({ progress: newProgress })
      .eq('id', goalId);

    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, progress: newProgress } : g)));
  };

  const completeTask = useCallback(async (id: string) => {
    const completedAt = new Date().toISOString();

    let targetGoalId: string | undefined;
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          targetGoalId = t.goalId;
          return { ...t, status: 'completed' as const, completedAt };
        }
        return t;
      });
      if (targetGoalId) {
        setTimeout(() => updateGoalProgress(targetGoalId!, updated), 50);
      }
      return updated;
    });

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: completedAt })
      .eq('id', id);
    if (error) console.error("Error completing task on mobile:", error);

    if (userId) {
      const { data: userProfile } = await supabase.from('users').select('points, streak').eq('id', userId).single();
      if (userProfile) {
        const newPoints = (userProfile.points || 0) + 10;
        const newStreak = (userProfile.streak || 0) + 1;
        await supabase
          .from('users')
          .update({ points: newPoints, streak: newStreak })
          .eq('id', userId);
      }
    }
  }, [userId]);

  const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
    const newId = crypto.randomUUID();
    const taskData = {
      id: newId,
      user_id: userId,
      goal_id: task.goalId || null,
      title: task.title,
      description: task.description || null,
      category: task.category,
      due_time: task.dueTime || null,
      priority: task.priority,
      status: task.status,
      has_evidence: task.hasEvidence,
      recurring: task.recurring,
      notes: task.notes || null,
      date: task.date,
    };

    const { error } = await supabase.from('tasks').insert(taskData);
    if (error) throw error;

    const newTask: Task = {
      id: newId,
      goalId: task.goalId,
      title: task.title,
      description: task.description,
      category: task.category,
      dueTime: task.dueTime,
      priority: task.priority,
      status: task.status,
      hasEvidence: task.hasEvidence,
      recurring: task.recurring,
      notes: task.notes,
      date: task.date,
    };

    setTasks((prev) => {
      const updated = [...prev, newTask];
      if (task.goalId) {
        setTimeout(() => updateGoalProgress(task.goalId!, updated), 50);
      }
      return updated;
    });
  }, [userId]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id'>) => {
    const newId = crypto.randomUUID();
    const goalData = {
      id: newId,
      user_id: userId,
      title: goal.title,
      description: goal.description,
      week_start: goal.weekStart,
      category: goal.category,
      progress: goal.progress,
      color: goal.color,
    };

    const { error } = await supabase.from('goals').insert(goalData);
    if (error) throw error;

    const newGoal: Goal = {
      id: newId,
      title: goal.title,
      description: goal.description,
      weekStart: goal.weekStart,
      category: goal.category,
      progress: goal.progress,
      color: goal.color,
      taskIds: [],
    };

    setGoals((prev) => [...prev, newGoal]);
  }, [userId]);

  const likePost = useCallback(async (id: string) => {
    const postToUpdate = posts.find((p) => p.id === id);
    if (!postToUpdate || !userId) return;

    const isLiking = !postToUpdate.liked;
    const newLikes = isLiking ? postToUpdate.likes + 1 : Math.max(0, postToUpdate.likes - 1);

    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, liked: isLiking, likes: newLikes } : p)));

    if (isLiking) {
      await supabase.from('post_likes').insert({ post_id: id, user_id: userId });
      await supabase.from('posts').update({ likes: newLikes }).eq('id', id);
    } else {
      await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', userId);
      await supabase.from('posts').update({ likes: newLikes }).eq('id', id);
    }
  }, [userId, posts]);

  const addPost = useCallback(async (content: string, type: Post['type']) => {
    if (!userId) return;
    const newId = crypto.randomUUID();

    const { data: userProfile } = await supabase.from('users').select('name, role').eq('id', userId).single();

    const postData = {
      id: newId,
      user_id: userId,
      user_name: userProfile?.name || 'Anonymous',
      user_role: userProfile?.role || 'member',
      content,
      type,
      likes: 0,
      comments: 0,
    };

    const { error } = await supabase.from('posts').insert(postData);
    if (error) throw error;

    const newPost: Post = {
      id: newId,
      userId,
      userName: postData.user_name,
      userRole: postData.user_role as any,
      content,
      type,
      likes: 0,
      comments: 0,
      liked: false,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
  }, [userId]);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  }, [userId]);

  const addEvidence = useCallback(async (ev: Omit<Evidence, 'id'>) => {
    if (!userId) return;
    const newId = crypto.randomUUID();

    const { data: userProfile } = await supabase.from('users').select('name').eq('id', userId).single();

    const evData = {
      id: newId,
      task_id: ev.taskId,
      task_title: ev.taskTitle,
      user_id: userId,
      user_name: userProfile?.name || 'Anonymous',
      type: ev.type,
      uri: ev.uri || null,
      link: ev.link || null,
      description: ev.description,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('evidence').insert(evData);
    if (error) throw error;

    await supabase.from('tasks').update({ has_evidence: true }).eq('id', ev.taskId);

    const newEvidence: Evidence = {
      id: newId,
      taskId: ev.taskId,
      taskTitle: ev.taskTitle,
      type: ev.type,
      uri: ev.uri,
      link: ev.link,
      description: ev.description,
      status: 'pending',
      uploadedAt: evData.uploaded_at,
      userName: evData.user_name,
    };

    setEvidence((prev) => [newEvidence, ...prev]);
    setTasks((prev) => prev.map((t) => (t.id === ev.taskId ? { ...t, hasEvidence: true } : t)));
  }, [userId]);

  const approveEvidence = useCallback(async (id: string) => {
    const { error } = await supabase.from('evidence').update({ status: 'approved' }).eq('id', id);
    if (error) throw error;

    setEvidence((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'approved' } : e)));
  }, []);

  const rejectEvidence = useCallback(async (id: string, feedback: string) => {
    const { error } = await supabase.from('evidence').update({ status: 'rejected', feedback }).eq('id', id);
    if (error) throw error;

    setEvidence((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'rejected', feedback } : e)));
  }, []);

  const loadTeamMembers = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'approved');
      if (error) throw error;

      if (data) {
        setTeamMembers(data.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
          role: t.role as any,
          streak: t.streak,
          points: t.points,
          completionRate: t.completion_rate,
          consistency: t.consistency,
          joinedAt: t.joined_at,
          title: t.title || undefined,
          leaderId: t.leader_id || "",
          sponsorId: t.sponsor_id || undefined,
          lastActive: t.joined_at || new Date().toISOString(),
          status: (t.completion_rate >= 80 ? 'active' : t.completion_rate >= 50 ? 'at-risk' : 'inactive') as any,
          tasks: [],
          goals: [],
          evidence: [],
        })));
      }
    } catch {}
  }, [userId]);

  const loadTeamMessages = useCallback(async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const mapped: TeamMessage[] = (data || []).map((m) => ({
        id: m.id,
        memberId: m.member_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        content: m.content,
        type: m.type as any,
        sentAt: m.sent_at,
      }));

      setTeamMessages((prev) => ({ ...prev, [memberId]: mapped }));
    } catch (err) {
      console.error("Error loading team messages on mobile:", err);
    }
  }, []);

  const sendTeamMessage = useCallback(async (
    memberId: string,
    content: string,
    senderId: string,
    senderName: string,
    type: TeamMessage['type'] = 'message'
  ) => {
    const newId = crypto.randomUUID();
    const msgData = {
      id: newId,
      member_id: memberId,
      sender_id: senderId,
      sender_name: senderName,
      content,
      type,
      sent_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('team_messages').insert(msgData);
    if (error) throw error;

    const newMsg: TeamMessage = {
      id: newId,
      memberId,
      senderId,
      senderName,
      content,
      type,
      sentAt: msgData.sent_at,
    };

    setTeamMessages((prev) => ({
      ...prev,
      [memberId]: [...(prev[memberId] ?? []), newMsg],
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
