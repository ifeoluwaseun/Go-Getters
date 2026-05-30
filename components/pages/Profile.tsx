import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Trophy, Star, Shield, Camera, Heart, LogOut } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  trophy: Trophy,
  camera: Camera,
  heart: Heart,
  shield: Shield,
};

export default function Profile() {
  const { currentUser, logout, updateUser } = useAuth();
  const { achievements } = useApp();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [title, setTitle] = useState(currentUser?.title ?? "");

  if (!currentUser) return null;

  const handleSave = () => {
    updateUser({ name, title });
    setEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const getRoleBadge = () => {
    if (currentUser.role === "admin") return "bg-purple-500/20 text-purple-400";
    if (currentUser.role === "leader") return "bg-primary/20 text-primary";
    return "bg-muted/30 text-muted-foreground";
  };

  const initials = currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Your progress, your story.</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2 font-semibold text-destructive hover:text-destructive" data-testid="button-logout">
          <LogOut size={16} /> Logout
        </Button>
      </div>

      {/* Identity Card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-3xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="profile-name">Name</Label>
                  <Input id="profile-name" data-testid="input-profile-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profile-title">Title</Label>
                  <Input id="profile-title" data-testid="input-profile-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} data-testid="button-save-profile">Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black">{currentUser.name}</h2>
                {currentUser.title && <p className="text-muted-foreground text-sm mt-0.5">{currentUser.title}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${getRoleBadge()}`}>
                    {currentUser.role}
                  </span>
                  {currentUser.leaderName && (
                    <span className="text-xs text-muted-foreground">
                      Leader: <span className="text-foreground font-medium">{currentUser.leaderName}</span>
                    </span>
                  )}
                  {currentUser.sponsorName && (
                    <span className="text-xs text-muted-foreground">
                      Sponsor: <span className="text-foreground font-medium">{currentUser.sponsorName}</span>
                    </span>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="mt-3 font-semibold" data-testid="button-edit-profile">
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Streak", value: `${currentUser.streak}d`, color: "text-orange-500" },
          { label: "Points", value: currentUser.points.toLocaleString(), color: "text-primary" },
          { label: "Completion", value: `${currentUser.completionRate}%`, color: "text-green-500" },
          { label: "Consistency", value: `${currentUser.consistency}%`, color: "text-yellow-500" },
        ].map((stat) => (
          <Card key={stat.label} data-testid={`stat-${stat.label.toLowerCase()}`}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-semibold">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Joined */}
      <Card>
        <CardContent className="p-4 flex justify-between items-center">
          <span className="text-muted-foreground text-sm font-medium">Member since</span>
          <span className="font-bold">{new Date(currentUser.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
        </CardContent>
      </Card>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((a) => {
                const Icon = ICON_MAP[a.icon] ?? Trophy;
                return (
                  <div
                    key={a.id}
                    data-testid={`card-achievement-${a.id}`}
                    className="flex flex-col items-center text-center p-4 bg-background rounded-xl border border-border gap-2"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: a.color + "22" }}
                    >
                      <Icon size={24} style={{ color: a.color }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{a.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
