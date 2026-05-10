import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { tasks, goals, meetings, notifications, teamMembers } = useApp();

  if (!currentUser) return null;

  const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]);
  const completedTasksCount = todayTasks.filter(t => t.status === 'completed').length;
  const unreadNotifications = notifications.filter(n => !n.isRead).slice(0, 3);
  const nextMeeting = meetings[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Welcome back, {currentUser.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Here is what is happening today.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-muted-foreground">Streak</div>
            <div className="text-3xl font-black mt-1 text-orange-500">{currentUser.streak} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-muted-foreground">Points</div>
            <div className="text-3xl font-black mt-1 text-primary">{currentUser.points}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-muted-foreground">Completion</div>
            <div className="text-3xl font-black mt-1 text-green-500">{currentUser.completionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-muted-foreground">Consistency</div>
            <div className="text-3xl font-black mt-1 text-yellow-500">{currentUser.consistency}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Tasks Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Today's Targets</CardTitle>
              <Link href="/tasks" className="text-sm text-primary hover:underline font-medium">View All</Link>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress ({completedTasksCount}/{todayTasks.length})</span>
                  <span className="font-bold">{Math.round((completedTasksCount / Math.max(todayTasks.length, 1)) * 100)}%</span>
                </div>
                <Progress value={(completedTasksCount / Math.max(todayTasks.length, 1)) * 100} className="h-2" />
              </div>
              <div className="space-y-3 mt-4">
                {todayTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${task.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>
                        {task.title}
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent font-medium">{task.category}</span>
                        <span>{task.dueTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goals Preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Active Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map(goal => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="font-semibold">{goal.title}</div>
                      <div className="font-bold text-primary">{goal.progress}%</div>
                    </div>
                    <Progress value={goal.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Meeting Card */}
          {nextMeeting && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-primary uppercase tracking-wider">Next Meeting</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-bold text-lg mb-1">{nextMeeting.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">Starts at {new Date(nextMeeting.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <a href={nextMeeting.link} target="_blank" rel="noreferrer" className="inline-block w-full text-center bg-primary text-primary-foreground font-bold py-2 rounded-md hover:bg-primary/90 transition-colors">
                  Join Call
                </a>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
              <Link href="/notifications"><ChevronRight className="text-muted-foreground" size={20}/></Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {unreadNotifications.length > 0 ? unreadNotifications.map(n => (
                <div key={n.id} className="text-sm p-3 bg-background rounded-lg border border-border">
                  <div className="font-bold">{n.title}</div>
                  <div className="text-muted-foreground mt-1 line-clamp-2">{n.body}</div>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-4">All caught up!</div>
              )}
            </CardContent>
          </Card>

          {/* Team Summary for Leaders/Admins */}
          {(currentUser.role === 'leader' || currentUser.role === 'admin') && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Team Pulse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Active Members</span>
                  <span className="font-bold text-lg">{teamMembers.length}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Avg Completion</span>
                  <span className="font-bold text-lg text-green-500">
                    {Math.round(teamMembers.reduce((acc, m) => acc + m.completionRate, 0) / Math.max(teamMembers.length, 1))}%
                  </span>
                </div>
                <Link href="/team" className="block mt-4 text-center text-sm text-primary hover:underline font-medium">View Team Dashboard</Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
