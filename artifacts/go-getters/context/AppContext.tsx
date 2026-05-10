import React, { createContext, useCallback, useContext, useState } from 'react';
import { Task, Goal, Post, Meeting, Achievement, AppNotification, LeaderboardUser, WeeklyAchiever, Evidence, TeamMember, TeamMessage } from '@/types';

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
  completeTask: (id: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  likePost: (id: string) => void;
  addPost: (content: string, type: Post['type']) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addEvidence: (ev: Omit<Evidence, 'id'>) => void;
  approveEvidence: (id: string) => void;
  rejectEvidence: (id: string, feedback: string) => void;
  sendTeamMessage: (memberId: string, content: string, senderId: string, senderName: string, type?: TeamMessage['type']) => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

const today = new Date().toISOString().split('T')[0];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Morning Prospecting (10 contacts)', category: 'Prospecting', dueTime: '09:00', priority: 'high', status: 'completed', hasEvidence: true, recurring: true, date: today, completedAt: new Date().toISOString() },
  { id: 't2', title: 'Follow up with leads from yesterday', category: 'Follow-Up', dueTime: '10:30', priority: 'high', status: 'completed', hasEvidence: false, recurring: false, date: today, completedAt: new Date().toISOString() },
  { id: 't3', title: 'Read 10 pages of "Go-Giver"', category: 'Personal Dev', dueTime: '12:00', priority: 'medium', status: 'completed', hasEvidence: true, recurring: true, date: today },
  { id: 't4', title: 'Team check-in call', category: 'Leadership', dueTime: '14:00', priority: 'high', status: 'pending', hasEvidence: false, recurring: true, date: today },
  { id: 't5', title: 'Post daily win on community feed', category: 'Content', dueTime: '16:00', priority: 'medium', status: 'pending', hasEvidence: false, recurring: true, date: today },
  { id: 't6', title: 'Evening review & plan tomorrow', category: 'Planning', dueTime: '20:00', priority: 'medium', status: 'pending', hasEvidence: false, recurring: true, date: today },
  { id: 't7', title: 'Share business opportunity with prospect', category: 'Prospecting', dueTime: '11:00', priority: 'high', status: 'overdue', hasEvidence: false, recurring: false, date: today },
];

const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: 'Recruit 3 new team members', description: 'Focus on warm market and referrals', weekStart: today, category: 'Recruitment', taskIds: ['t1', 't7'], progress: 65, color: '#00d8fe' },
  { id: 'g2', title: 'Complete personal development plan', description: 'Read 2 books and attend 1 training', weekStart: today, category: 'Growth', taskIds: ['t3'], progress: 40, color: '#00e57d' },
  { id: 'g3', title: 'Hit $5,000 in sales volume', description: 'Weekly sales target for this period', weekStart: today, category: 'Sales', taskIds: ['t2'], progress: 78, color: '#fbbf24' },
];

const INITIAL_POSTS: Post[] = [
  { id: 'p1', userId: 'u2', userName: 'Sarah K.', userRole: 'leader', content: 'Just hit 100% completion for the 7th day in a row! The streak system keeps me locked in every single day. Who else is building unstoppable habits?', likes: 24, liked: false, comments: 8, createdAt: new Date(Date.now() - 3600000).toISOString(), type: 'win' },
  { id: 'p2', userId: 'u1', userName: 'Alex Rivera', userRole: 'admin', content: 'Weekly Achiever announcement dropping tonight at 8 PM. The consistency scores this week have been INCREDIBLE. Keep pushing — your name might be on that list.', likes: 47, liked: true, comments: 19, createdAt: new Date(Date.now() - 7200000).toISOString(), type: 'announcement' },
  { id: 'p3', userId: 'u3', userName: 'James T.', userRole: 'member', content: 'Closed my first enterprise deal today after 3 weeks of consistent prospecting. The daily task system works if you just trust the process and execute every day.', likes: 63, liked: false, comments: 22, createdAt: new Date(Date.now() - 14400000).toISOString(), type: 'win' },
  { id: 'p4', userId: 'u4', userName: 'Priya M.', userRole: 'leader', content: 'Remember: consistency beats intensity every time. One imperfect task completed daily beats one perfect task done weekly. Show up. Every. Single. Day.', likes: 38, liked: false, comments: 11, createdAt: new Date(Date.now() - 86400000).toISOString(), type: 'motivation' },
  { id: 'p5', userId: 'u5', userName: 'Devon L.', userRole: 'member', content: 'Just submitted my evidence for this morning\'s prospecting session. 12 contacts made, 3 serious follow-ups scheduled. Week is looking strong!', likes: 18, liked: false, comments: 5, createdAt: new Date(Date.now() - 172800000).toISOString(), type: 'update' },
];

const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { id: 'u1', name: 'Alex Rivera', role: 'admin', points: 4820, streak: 21, completionRate: 97, rank: 1, change: 'same' },
  { id: 'u2', name: 'Sarah K.', role: 'leader', points: 4210, streak: 18, completionRate: 95, rank: 2, change: 'up' },
  { id: 'u3', name: 'James T.', role: 'member', points: 3890, streak: 15, completionRate: 91, rank: 3, change: 'up' },
  { id: 'u4', name: 'Priya M.', role: 'leader', points: 3640, streak: 14, completionRate: 94, rank: 4, change: 'down' },
  { id: 'u6', name: 'Marcus J.', role: 'leader', points: 3200, streak: 12, completionRate: 88, rank: 5, change: 'up' },
  { id: 'u7', name: 'Nina P.', role: 'member', points: 2950, streak: 10, completionRate: 86, rank: 6, change: 'same' },
  { id: 'u8', name: 'Devon L.', role: 'member', points: 2700, streak: 8, completionRate: 82, rank: 7, change: 'down' },
  { id: 'u9', name: 'Chen W.', role: 'member', points: 2400, streak: 7, completionRate: 79, rank: 8, change: 'up' },
];

const INITIAL_MEETINGS: Meeting[] = [
  { id: 'm1', title: 'Weekly Team Accountability Call', description: 'Review goals, celebrate wins, address obstacles', startTime: new Date(Date.now() + 5400000).toISOString(), endTime: new Date(Date.now() + 9000000).toISOString(), link: 'https://zoom.us/j/123456789', type: 'accountability', host: 'Alex Rivera' },
  { id: 'm2', title: 'Leadership Training Session', description: 'Advanced prospecting techniques and objection handling', startTime: new Date(Date.now() + 172800000).toISOString(), endTime: new Date(Date.now() + 180000000).toISOString(), link: 'https://meet.google.com/abc-defg-hij', type: 'training', host: 'Sarah K.' },
  { id: 'm3', title: 'New Member Onboarding', description: 'Welcome and system walkthrough for new go-getters', startTime: new Date(Date.now() + 259200000).toISOString(), endTime: new Date(Date.now() + 262800000).toISOString(), link: 'https://zoom.us/j/987654321', type: 'team', host: 'Priya M.' },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'achievement', title: 'Badge Unlocked: 14-Day Warrior', body: 'You\'ve maintained a 14-day streak. Keep the momentum going!', isRead: false, createdAt: new Date(Date.now() - 1800000).toISOString(), level: 1 },
  { id: 'n2', type: 'reminder', title: 'Team check-in starts in 30 min', body: 'Your 2:00 PM accountability call is coming up. Be ready to share your wins.', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString(), level: 1 },
  { id: 'n3', type: 'alert', title: 'Task overdue: Share business opportunity', body: 'This task was due at 11:00 AM. Complete it now to protect your streak.', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString(), level: 2 },
  { id: 'n4', type: 'announcement', title: 'Weekly Achievers Announced', body: 'This week\'s top performers have been recognized. Check the Achievers tab!', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString(), level: 1 },
  { id: 'n5', type: 'streak', title: 'You\'re on fire! 14 days strong', body: 'Your consistency is in the top 10%. Don\'t break the chain tonight.', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString(), level: 1 },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', type: 'streak', title: '14-Day Warrior', description: 'Maintained a 14-day completion streak', icon: 'flame', earnedAt: new Date(Date.now() - 1800000).toISOString(), color: '#ff6b35' },
  { id: 'a2', type: 'performance', title: 'Top Performer', description: 'Ranked in the top 5 on the leaderboard', icon: 'trophy', earnedAt: new Date(Date.now() - 604800000).toISOString(), color: '#fbbf24' },
  { id: 'a3', type: 'evidence', title: 'Proof Machine', description: 'Uploaded evidence for 30 completed tasks', icon: 'camera', earnedAt: new Date(Date.now() - 1209600000).toISOString(), color: '#00d8fe' },
  { id: 'a4', type: 'community', title: 'Culture Builder', description: 'Received 50 likes on community posts', icon: 'heart', earnedAt: new Date(Date.now() - 1814400000).toISOString(), color: '#ec4899' },
  { id: 'a5', type: 'consistency', title: 'Iron Will', description: '7-day perfect completion rate', icon: 'shield-checkmark', earnedAt: new Date(Date.now() - 2419200000).toISOString(), color: '#00e57d' },
];

const INITIAL_ACHIEVERS: WeeklyAchiever[] = [
  { id: 'wa1', userId: 'u2', userName: 'Sarah K.', userRole: 'leader', title: 'Most Consistent', badge: 'Most Consistent', completionRate: 100, streak: 18, points: 520, weekStart: today, category: 'consistency' },
  { id: 'wa2', userId: 'u3', userName: 'James T.', userRole: 'member', title: 'Highest Performer', badge: 'Highest Performer', completionRate: 97, streak: 15, points: 490, weekStart: today, category: 'performance' },
  { id: 'wa3', userId: 'u1', userName: 'Alex Rivera', userRole: 'admin', title: 'Leadership Award', badge: 'Leadership Award', completionRate: 95, streak: 21, points: 580, weekStart: today, category: 'leadership' },
  { id: 'wa4', userId: 'u9', userName: 'Chen W.', userRole: 'member', title: 'Fastest Growth', badge: 'Fastest Growth', completionRate: 90, streak: 7, points: 420, weekStart: today, category: 'growth' },
];

const INITIAL_EVIDENCE: Evidence[] = [
  { id: 'ev1', taskId: 't1', taskTitle: 'Morning Prospecting', type: 'screenshot', description: 'Screenshot of 12 messages sent this morning', status: 'approved', uploadedAt: new Date(Date.now() - 3600000).toISOString(), userName: 'You' },
  { id: 'ev2', taskId: 't3', taskTitle: 'Read 10 pages of "Go-Giver"', type: 'image', description: 'Photo of today\'s reading session — pages 42-52', status: 'pending', uploadedAt: new Date(Date.now() - 7200000).toISOString(), userName: 'You' },
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'u3', name: 'James T.', email: 'james@example.com', role: 'member', leaderId: '2', sponsorId: '2', streak: 15, points: 3890, completionRate: 91, consistency: 88, joinedAt: '2024-03-01', title: 'Rising Star', lastActive: '2 hours ago', status: 'active',
    tasks: [
      { id: 'mt1', title: 'Morning Prospecting (10 contacts)', category: 'Prospecting', dueTime: '09:00', priority: 'high', status: 'completed', hasEvidence: true, recurring: true, date: today, completedAt: new Date().toISOString() },
      { id: 'mt2', title: 'Follow-up calls x5', category: 'Follow-Up', dueTime: '11:00', priority: 'high', status: 'completed', hasEvidence: false, recurring: false, date: today, completedAt: new Date().toISOString() },
      { id: 'mt3', title: 'Share daily win', category: 'Content', dueTime: '16:00', priority: 'medium', status: 'pending', hasEvidence: false, recurring: true, date: today },
      { id: 'mt4', title: 'Read leadership book', category: 'Personal Dev', dueTime: '20:00', priority: 'medium', status: 'pending', hasEvidence: false, recurring: true, date: today },
    ],
    goals: [
      { id: 'mg1', title: 'Close 5 new sales this week', description: 'Focus on warm market leads', weekStart: today, category: 'Sales', taskIds: ['mt1', 'mt2'], progress: 80, color: '#00d8fe' },
      { id: 'mg2', title: 'Complete prospecting training', description: 'Finish the online course modules', weekStart: today, category: 'Growth', taskIds: ['mt4'], progress: 60, color: '#fbbf24' },
    ],
    evidence: [
      { id: 'me1', taskId: 'mt1', taskTitle: 'Morning Prospecting', type: 'screenshot', description: 'DMs sent to 12 prospects this morning', status: 'approved', uploadedAt: new Date(Date.now() - 3600000).toISOString(), userName: 'James T.' },
    ],
  },
  {
    id: 'u2', name: 'Sarah K.', email: 'sarah@example.com', role: 'leader', leaderId: '1', sponsorId: '1', streak: 18, points: 4210, completionRate: 95, consistency: 92, joinedAt: '2024-02-10', title: 'Team Leader', lastActive: '30 min ago', status: 'active',
    tasks: [
      { id: 'st1', title: 'Team accountability call', category: 'Leadership', dueTime: '10:00', priority: 'high', status: 'completed', hasEvidence: true, recurring: true, date: today, completedAt: new Date().toISOString() },
      { id: 'st2', title: 'Morning prospecting', category: 'Prospecting', dueTime: '08:00', priority: 'high', status: 'completed', hasEvidence: true, recurring: true, date: today, completedAt: new Date().toISOString() },
      { id: 'st3', title: 'Personal development session', category: 'Personal Dev', dueTime: '13:00', priority: 'medium', status: 'pending', hasEvidence: false, recurring: true, date: today },
    ],
    goals: [
      { id: 'sg1', title: 'Maintain team 90%+ completion', description: 'Support all team members daily', weekStart: today, category: 'Leadership', taskIds: ['st1'], progress: 95, color: '#a855f7' },
      { id: 'sg2', title: 'Personal recruitment: 2 new members', description: 'Add to warm market outreach', weekStart: today, category: 'Recruitment', taskIds: ['st2'], progress: 50, color: '#00d8fe' },
    ],
    evidence: [
      { id: 'se1', taskId: 'st1', taskTitle: 'Team accountability call', type: 'screenshot', description: 'Recording link of today\'s team call', status: 'approved', uploadedAt: new Date(Date.now() - 1800000).toISOString(), userName: 'Sarah K.' },
      { id: 'se2', taskId: 'st2', taskTitle: 'Morning prospecting', type: 'link', description: 'LinkedIn outreach log — 15 messages', status: 'pending', uploadedAt: new Date(Date.now() - 7200000).toISOString(), userName: 'Sarah K.' },
    ],
  },
  {
    id: 'u7', name: 'Nina P.', email: 'nina@example.com', role: 'member', leaderId: '2', sponsorId: '2', streak: 10, points: 2950, completionRate: 86, consistency: 80, joinedAt: '2024-03-20', title: 'Go-Getter', lastActive: '1 hour ago', status: 'active',
    tasks: [
      { id: 'nt1', title: 'Morning prospecting', category: 'Prospecting', dueTime: '09:00', priority: 'high', status: 'completed', hasEvidence: true, recurring: true, date: today, completedAt: new Date().toISOString() },
      { id: 'nt2', title: 'Product demo with client', category: 'Sales', dueTime: '14:00', priority: 'high', status: 'pending', hasEvidence: false, recurring: false, date: today },
      { id: 'nt3', title: 'Post testimonial', category: 'Content', dueTime: '17:00', priority: 'medium', status: 'overdue', hasEvidence: false, recurring: false, date: today },
    ],
    goals: [
      { id: 'ng1', title: 'Book 3 product demos', description: 'Target existing warm market', weekStart: today, category: 'Sales', taskIds: ['nt2'], progress: 33, color: '#00e57d' },
    ],
    evidence: [
      { id: 'ne1', taskId: 'nt1', taskTitle: 'Morning prospecting', type: 'image', description: 'Photo of my contact list for today', status: 'pending', uploadedAt: new Date(Date.now() - 5400000).toISOString(), userName: 'Nina P.' },
    ],
  },
  {
    id: 'u8', name: 'Devon L.', email: 'devon@example.com', role: 'member', leaderId: '2', sponsorId: '2', streak: 3, points: 2700, completionRate: 62, consistency: 55, joinedAt: '2024-04-01', title: 'Go-Getter', lastActive: 'Yesterday', status: 'at-risk',
    tasks: [
      { id: 'dt1', title: 'Morning prospecting', category: 'Prospecting', dueTime: '09:00', priority: 'high', status: 'overdue', hasEvidence: false, recurring: true, date: today },
      { id: 'dt2', title: 'Follow-up calls', category: 'Follow-Up', dueTime: '11:00', priority: 'high', status: 'overdue', hasEvidence: false, recurring: true, date: today },
      { id: 'dt3', title: 'Evening review', category: 'Planning', dueTime: '20:00', priority: 'medium', status: 'pending', hasEvidence: false, recurring: true, date: today },
    ],
    goals: [
      { id: 'dg1', title: 'Get back on track this week', description: 'Complete at least 5 tasks per day', weekStart: today, category: 'Growth', taskIds: ['dt1', 'dt2', 'dt3'], progress: 20, color: '#ef4444' },
    ],
    evidence: [],
  },
  {
    id: 'u9', name: 'Chen W.', email: 'chen@example.com', role: 'member', leaderId: '2', sponsorId: '2', streak: 7, points: 2400, completionRate: 79, consistency: 74, joinedAt: '2024-04-10', title: 'Go-Getter', lastActive: '4 hours ago', status: 'active',
    tasks: [
      { id: 'ct1', title: 'Morning prospecting', category: 'Prospecting', dueTime: '09:00', priority: 'high', status: 'completed', hasEvidence: true, recurring: true, date: today, completedAt: new Date().toISOString() },
      { id: 'ct2', title: 'Read personal dev book', category: 'Personal Dev', dueTime: '12:00', priority: 'medium', status: 'completed', hasEvidence: false, recurring: true, date: today, completedAt: new Date().toISOString() },
      { id: 'ct3', title: 'Team training session', category: 'Leadership', dueTime: '15:00', priority: 'high', status: 'pending', hasEvidence: false, recurring: false, date: today },
    ],
    goals: [
      { id: 'cg1', title: 'Build product knowledge', description: 'Complete all training modules this week', weekStart: today, category: 'Growth', taskIds: ['ct2', 'ct3'], progress: 55, color: '#a855f7' },
    ],
    evidence: [
      { id: 'ce1', taskId: 'ct1', taskTitle: 'Morning prospecting', type: 'screenshot', description: 'Screenshot of 8 new LinkedIn connections today', status: 'approved', uploadedAt: new Date(Date.now() - 14400000).toISOString(), userName: 'Chen W.' },
    ],
  },
  {
    id: 'u4', name: 'Priya M.', email: 'priya@example.com', role: 'leader', leaderId: '1', sponsorId: '1', streak: 14, points: 3640, completionRate: 94, consistency: 90, joinedAt: '2024-02-20', title: 'Team Leader', lastActive: '1 hour ago', status: 'active',
    tasks: [
      { id: 'pt1', title: 'Morning team briefing', category: 'Leadership', dueTime: '08:30', priority: 'high', status: 'completed', hasEvidence: false, recurring: true, date: today, completedAt: new Date().toISOString() },
      { id: 'pt2', title: 'Prospecting session', category: 'Prospecting', dueTime: '10:00', priority: 'high', status: 'completed', hasEvidence: true, recurring: true, date: today, completedAt: new Date().toISOString() },
      { id: 'pt3', title: 'Leadership podcast', category: 'Personal Dev', dueTime: '18:00', priority: 'low', status: 'pending', hasEvidence: false, recurring: true, date: today },
    ],
    goals: [
      { id: 'pg1', title: 'Lead team to 95% weekly completion', description: 'Support every member to hit their targets', weekStart: today, category: 'Leadership', taskIds: ['pt1'], progress: 90, color: '#a855f7' },
    ],
    evidence: [
      { id: 'pe1', taskId: 'pt2', taskTitle: 'Prospecting session', type: 'screenshot', description: '10 warm outreach messages sent', status: 'approved', uploadedAt: new Date(Date.now() - 3600000).toISOString(), userName: 'Priya M.' },
    ],
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [leaderboard] = useState<LeaderboardUser[]>(INITIAL_LEADERBOARD);
  const [meetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [achievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [achievers] = useState<WeeklyAchiever[]>(INITIAL_ACHIEVERS);
  const [evidence, setEvidence] = useState<Evidence[]>(INITIAL_EVIDENCE);
  const [teamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [teamMessages, setTeamMessages] = useState<Record<string, TeamMessage[]>>({
    'u3': [
      { id: 'tm1', memberId: 'u3', senderId: '2', senderName: 'Marcus Johnson', content: 'Great start to the week James! Keep that streak alive.', sentAt: new Date(Date.now() - 86400000).toISOString(), type: 'message' },
      { id: 'tm2', memberId: 'u3', senderId: '2', senderName: 'Marcus Johnson', content: 'Remember to submit your evidence for the morning prospecting session once done.', sentAt: new Date(Date.now() - 3600000).toISOString(), type: 'reminder' },
    ],
    'u8': [
      { id: 'tm3', memberId: 'u8', senderId: '2', senderName: 'Marcus Johnson', content: 'Devon, I noticed you have a couple of overdue tasks today. Let me know if you need support — I am here to help.', sentAt: new Date(Date.now() - 7200000).toISOString(), type: 'message' },
      { id: 'tm4', memberId: 'u8', senderId: '2', senderName: 'Marcus Johnson', content: 'Consistency is built one day at a time. Let\'s get back on track together this week.', sentAt: new Date(Date.now() - 1800000).toISOString(), type: 'note' },
    ],
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const completeTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    const newTask: Task = { ...task, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = { ...goal, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
    setGoals((prev) => [...prev, newGoal]);
  }, []);

  const likePost = useCallback((id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  }, []);

  const addPost = useCallback((content: string, type: Post['type']) => {
    const newPost: Post = { id: Date.now().toString(), userId: 'me', userName: 'You', userRole: 'member', content, likes: 0, liked: false, comments: 0, createdAt: new Date().toISOString(), type };
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const addEvidence = useCallback((ev: Omit<Evidence, 'id'>) => {
    const newEv: Evidence = { ...ev, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
    setEvidence((prev) => [newEv, ...prev]);
    setTasks((prev) => prev.map((t) => t.id === ev.taskId ? { ...t, hasEvidence: true } : t));
  }, []);

  const approveEvidence = useCallback((id: string) => {
    setEvidence((prev) => prev.map((e) => e.id === id ? { ...e, status: 'approved' } : e));
  }, []);

  const rejectEvidence = useCallback((id: string, feedback: string) => {
    setEvidence((prev) => prev.map((e) => e.id === id ? { ...e, status: 'rejected', feedback } : e));
  }, []);

  const sendTeamMessage = useCallback((memberId: string, content: string, senderId: string, senderName: string, type: TeamMessage['type'] = 'message') => {
    const msg: TeamMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      memberId,
      senderId,
      senderName,
      content,
      sentAt: new Date().toISOString(),
      type,
    };
    setTeamMessages((prev) => ({
      ...prev,
      [memberId]: [...(prev[memberId] ?? []), msg],
    }));
  }, []);

  return (
    <AppContext.Provider value={{ tasks, goals, posts, leaderboard, meetings, notifications, achievements, achievers, evidence, teamMembers, teamMessages, unreadCount, completeTask, addTask, addGoal, likePost, addPost, markNotificationRead, markAllRead, addEvidence, approveEvidence, rejectEvidence, sendTeamMessage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
