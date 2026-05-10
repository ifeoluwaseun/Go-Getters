import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Flame, Trophy, Star, Award } from "lucide-react";

type Tab = "leaderboard" | "achievers";

const BADGE_ICONS: Record<string, React.ElementType> = {
  consistency: Star,
  performance: Trophy,
  leadership: Award,
  growth: TrendingUp,
};

export default function Leaderboard() {
  const { leaderboard, achievers } = useApp();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>("leaderboard");

  const getRoleBadge = (role: string) => {
    if (role === "admin") return "bg-purple-500/20 text-purple-400";
    if (role === "leader") return "bg-primary/20 text-primary";
    return "bg-muted/30 text-muted-foreground";
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return "bg-yellow-500 text-black";
    if (rank === 2) return "bg-zinc-400 text-black";
    if (rank === 3) return "bg-amber-700 text-white";
    return "bg-muted/30 text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Rankings reset weekly. Keep executing.</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={tab === "leaderboard" ? "default" : "outline"}
          onClick={() => setTab("leaderboard")}
          data-testid="button-tab-leaderboard"
          className="gap-2"
        >
          <Trophy size={16} /> Rankings
        </Button>
        <Button
          variant={tab === "achievers" ? "default" : "outline"}
          onClick={() => setTab("achievers")}
          data-testid="button-tab-achievers"
          className="gap-2"
        >
          <Star size={16} /> Weekly Achievers
        </Button>
      </div>

      {tab === "leaderboard" && (
        <div className="space-y-2">
          {leaderboard.map((user) => {
            const isCurrentUser = user.id === currentUser?.id ||
              (currentUser && user.name.split(" ")[0] === currentUser.name.split(" ")[0]);
            return (
              <Card
                key={user.id}
                data-testid={`card-leaderboard-${user.id}`}
                className={`transition-all ${isCurrentUser ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${getRankMedal(user.rank)}`}>
                    {user.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{user.name}</span>
                      {isCurrentUser && (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">You</span>
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Flame size={13} className="text-orange-500" />
                        <span className="font-semibold text-foreground">{user.streak}</span> streak
                      </span>
                      <span>
                        <span className="font-semibold text-green-500">{user.completionRate}%</span> completion
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-black text-primary">{user.points.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>

                  <div className="flex-shrink-0">
                    {user.change === "up" ? (
                      <TrendingUp size={18} className="text-green-500" />
                    ) : user.change === "down" ? (
                      <TrendingDown size={18} className="text-destructive" />
                    ) : (
                      <Minus size={18} className="text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "achievers" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {achievers.map((achiever) => {
            const Icon = BADGE_ICONS[achiever.category] ?? Trophy;
            return (
              <Card key={achiever.id} data-testid={`card-achiever-${achiever.id}`} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-primary uppercase tracking-wider">{achiever.badge}</div>
                      <div className="font-bold text-lg leading-tight">{achiever.userName}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background rounded-md p-2">
                      <div className="text-lg font-black text-orange-500">{achiever.streak}</div>
                      <div className="text-xs text-muted-foreground">Streak</div>
                    </div>
                    <div className="bg-background rounded-md p-2">
                      <div className="text-lg font-black text-green-500">{achiever.completionRate}%</div>
                      <div className="text-xs text-muted-foreground">Done</div>
                    </div>
                    <div className="bg-background rounded-md p-2">
                      <div className="text-lg font-black text-primary">{achiever.points}</div>
                      <div className="text-xs text-muted-foreground">Pts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
