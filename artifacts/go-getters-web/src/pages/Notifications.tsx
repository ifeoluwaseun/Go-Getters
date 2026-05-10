import { useApp } from "@/context/AppContext";
import { AppNotification } from "@/context/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Trophy, AlertTriangle, Megaphone, Flame, CheckCheck } from "lucide-react";

const TYPE_CONFIG: Record<AppNotification["type"], { icon: React.ElementType; color: string }> = {
  achievement: { icon: Trophy, color: "text-yellow-500" },
  reminder: { icon: Bell, color: "text-primary" },
  alert: { icon: AlertTriangle, color: "text-destructive" },
  announcement: { icon: Megaphone, color: "text-purple-500" },
  streak: { icon: Flame, color: "text-orange-500" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { notifications, markNotificationRead, markAllRead, unreadCount } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className="gap-2 font-semibold" data-testid="button-mark-all-read">
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
          <Bell size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            const Icon = cfg.icon;
            return (
              <Card
                key={n.id}
                data-testid={`card-notification-${n.id}`}
                className={`cursor-pointer transition-all ${!n.isRead ? "border-primary/30 bg-primary/5" : "opacity-70"}`}
                onClick={() => markNotificationRead(n.id)}
              >
                <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                  <div className={`flex-shrink-0 mt-0.5 ${cfg.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold leading-snug">{n.title}</div>
                      {!n.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">
                    {timeAgo(n.createdAt)}
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
