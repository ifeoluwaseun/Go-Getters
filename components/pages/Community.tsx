import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/context/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, MessageCircle, Megaphone, Trophy, Zap, Newspaper, Plus } from "lucide-react";
import { useForm } from "react-hook-form";

type PostType = Post["type"];
type FilterType = "all" | PostType;

const TYPE_CONFIG: Record<PostType, { label: string; color: string; icon: React.ElementType }> = {
  win: { label: "Win", color: "text-green-500 bg-green-500/10", icon: Trophy },
  motivation: { label: "Motivation", color: "text-yellow-500 bg-yellow-500/10", icon: Zap },
  update: { label: "Update", color: "text-primary bg-primary/10", icon: Newspaper },
  announcement: { label: "Announcement", color: "text-purple-500 bg-purple-500/10", icon: Megaphone },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface PostForm { content: string; type: PostType; }

export default function Community() {
  const { posts, likePost, addPost } = useApp();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<FilterType>("all");
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, watch, setValue, reset } = useForm<PostForm>({
    defaultValues: { type: "win" },
  });
  const selectedType = watch("type");

  const filtered = posts.filter((p) => filter === "all" || p.type === filter);

  const onSubmit = (data: PostForm) => {
    addPost(data.content, data.type);
    reset();
    setOpen(false);
  };

  const getRoleBadge = (role: Post["userRole"]) => {
    if (role === "admin") return "bg-purple-500/20 text-purple-400";
    if (role === "leader") return "bg-primary/20 text-primary";
    return "bg-muted/30 text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Community Feed</h1>
          <p className="text-muted-foreground">Share wins, celebrate each other, stay fired up.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2" data-testid="button-create-post">
              <Plus size={18} /> Share a Win
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share with the Community</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Post Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(TYPE_CONFIG) as [PostType, typeof TYPE_CONFIG[PostType]][]).map(([type, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue("type", type)}
                        data-testid={`button-post-type-${type}`}
                        className={`flex items-center gap-2 border rounded-md py-2 px-3 text-sm font-semibold transition-colors ${
                          selectedType === type ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Icon size={16} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" {...register("type")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-content">Message</Label>
                <Textarea
                  id="post-content"
                  data-testid="textarea-post-content"
                  placeholder="What's your win today? Share it with the team..."
                  rows={4}
                  {...register("content", { required: true })}
                />
              </div>
              <Button type="submit" className="w-full font-bold" data-testid="button-submit-post">
                Post to Community
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          { id: "all", label: "All" },
          { id: "win", label: "Wins" },
          { id: "announcement", label: "Announcements" },
          { id: "motivation", label: "Motivation" },
          { id: "update", label: "Updates" },
        ] as { id: FilterType; label: string }[]).map((f) => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
            size="sm"
            data-testid={`button-filter-${f.id}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((post) => {
          const cfg = TYPE_CONFIG[post.type];
          const Icon = cfg.icon;
          const initials = post.userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <Card key={post.id} data-testid={`card-post-${post.id}`}>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold">{post.userName}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${getRoleBadge(post.userRole)}`}>
                        {post.userRole}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                        <Icon size={12} /> {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">{timeAgo(post.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{post.content}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <button
                        onClick={() => likePost(post.id)}
                        data-testid={`button-like-${post.id}`}
                        className={`flex items-center gap-1.5 transition-colors hover:text-red-500 ${post.liked ? "text-red-500" : ""}`}
                      >
                        <Heart size={16} fill={post.liked ? "currentColor" : "none"} />
                        <span className="font-semibold">{post.likes}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle size={16} />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
          <p className="font-semibold">Nothing to show</p>
          <p className="text-sm mt-1">Be the first to share something with the community.</p>
        </div>
      )}
    </div>
  );
}
