export type UserRole = 'admin' | 'leader' | 'sponsor' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  streak: number;
  points: number;
  completionRate: number;
  consistency: number;
  joinedAt: string;
  title?: string;
  sponsorId?: string;
}

export type TaskStatus = 'pending' | 'completed' | 'overdue' | 'skipped';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  goalId?: string;
  title: string;
  description?: string;
  category: string;
  dueTime?: string;
  priority: TaskPriority;
  status: TaskStatus;
  hasEvidence: boolean;
  evidenceIds?: string[];
  notes?: string;
  recurring: boolean;
  completedAt?: string;
  date: string;
}

export type EvidenceStatus = 'pending' | 'approved' | 'rejected';
export type EvidenceType = 'image' | 'screenshot' | 'link' | 'voice';

export interface Evidence {
  id: string;
  taskId: string;
  taskTitle: string;
  type: EvidenceType;
  uri?: string;
  link?: string;
  description: string;
  status: EvidenceStatus;
  feedback?: string;
  uploadedAt: string;
  userName: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  weekStart: string;
  category: string;
  taskIds: string[];
  progress: number;
  color: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  likes: number;
  liked: boolean;
  comments: number;
  createdAt: string;
  type: 'win' | 'motivation' | 'update' | 'announcement';
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  link: string;
  type: 'accountability' | 'team' | 'training' | 'support';
  host: string;
}

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  color: string;
}

export type NotificationLevel = 1 | 2 | 3;

export interface AppNotification {
  id: string;
  type: 'reminder' | 'achievement' | 'alert' | 'announcement' | 'streak';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  level: NotificationLevel;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  role: UserRole;
  points: number;
  streak: number;
  completionRate: number;
  rank: number;
  change: 'up' | 'down' | 'same';
}

export interface WeeklyAchiever {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  title: string;
  badge: string;
  completionRate: number;
  streak: number;
  points: number;
  weekStart: string;
  category: string;
}

export type MemberStatus = 'active' | 'at-risk' | 'inactive';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sponsorId: string;
  streak: number;
  points: number;
  completionRate: number;
  consistency: number;
  joinedAt: string;
  title?: string;
  lastActive: string;
  status: MemberStatus;
  tasks: Task[];
  goals: Goal[];
  evidence: Evidence[];
  phone?: string;
}
