-- 1. Create Public USERS Profile table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  streak INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  completion_rate REAL NOT NULL DEFAULT 0,
  consistency REAL NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL,
  title TEXT,
  leader_id TEXT,
  leader_name TEXT,
  sponsor_id TEXT,
  sponsor_name TEXT,
  rejection_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow users update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Allow public inserts" ON public.users FOR INSERT 
  WITH CHECK (
    auth.uid()::text = id AND (
      (role IN ('member', 'leader') AND status = 'pending') OR
      (role = 'admin' AND status = 'approved' AND (NOT EXISTS (SELECT 1 FROM public.users)))
    )
  );

-- 2. Create GOALS table
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  week_start TEXT NOT NULL,
  category TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#00d8fe',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read goals" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Allow users manage own goals" ON public.goals FOR ALL USING (auth.uid()::text = user_id);

-- 3. Create TASKS table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES public.goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  due_time TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  has_evidence BOOLEAN NOT NULL DEFAULT false,
  recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  date TEXT NOT NULL,
  completed_at TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow users manage own tasks" ON public.tasks FOR ALL USING (auth.uid()::text = user_id);

-- 4. Create EVIDENCE table
CREATE TABLE IF NOT EXISTS public.evidence (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'screenshot',
  uri TEXT,
  link TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  feedback TEXT,
  uploaded_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Allow users manage own evidence" ON public.evidence FOR ALL USING (auth.uid()::text = user_id);

-- 5. Create POSTS table
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'member',
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'win',
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow users manage own posts" ON public.posts FOR ALL USING (auth.uid()::text = user_id);

-- 6. Create POST_LIKES table
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read post likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Allow users manage own post likes" ON public.post_likes FOR ALL USING (auth.uid()::text = user_id);

-- 7. Create MEETINGS table
CREATE TABLE IF NOT EXISTS public.meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'accountability',
  host TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Allow admin manage meetings" ON public.meetings FOR ALL 
  USING (exists (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid()::text AND users.role = 'admin'
  ));

-- 8. Create NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'announcement',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users manage own notifications" ON public.notifications FOR ALL USING (auth.uid()::text = user_id);

-- 9. Create ACHIEVEMENTS table
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  earned_at TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#00d8fe'
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Allow users manage own achievements" ON public.achievements FOR ALL USING (auth.uid()::text = user_id);

-- 10. Create TEAM_MESSAGES table
CREATE TABLE IF NOT EXISTS public.team_messages (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'message',
  sent_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users manage own team messages" ON public.team_messages FOR ALL USING (auth.uid()::text = member_id OR auth.uid()::text = sender_id);

-- 11. Create PUSH_SUBSCRIPTIONS table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users manage own push" ON public.push_subscriptions FOR ALL USING (auth.uid()::text = user_id);

