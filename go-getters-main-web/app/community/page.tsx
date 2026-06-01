"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/types";
import { Heart, MessageCircle, Megaphone, Trophy, Zap, Newspaper, Plus, X } from "lucide-react";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";

type PostType = Post["type"];
type FilterType = "all" | PostType;

const TYPE_CONFIG: Record<PostType, { label: string; color: string; hoverBorder: string; icon: React.ElementType }> = {
  win: { label: "Win", color: "text-green-400 bg-green-500/10", hoverBorder: "hover:border-green-500/30", icon: Trophy },
  motivation: { label: "Motivation", color: "text-yellow-400 bg-yellow-500/10", hoverBorder: "hover:border-yellow-500/30", icon: Zap },
  update: { label: "Update", color: "text-primary bg-primary/10", hoverBorder: "hover:border-primary/30", icon: Newspaper },
  announcement: { label: "Announcement", color: "text-purple-400 bg-purple-500/10", hoverBorder: "hover:border-purple-500/30", icon: Megaphone },
};

function timeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return `just now`;
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch (e) {
    return "some time ago";
  }
}

export default function Community() {
  const { posts, likePost, addPost, isLoading: appLoading } = useApp();
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [filter, setFilter] = useState<FilterType>("all");
  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState<PostType>("win");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle redirects if user is not approved
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    } else if (!authLoading && currentUser && currentUser.status === "pending") {
      router.push("/pending");
    } else if (!authLoading && currentUser && currentUser.status === "rejected") {
      router.push("/rejected");
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || appLoading || !currentUser || currentUser.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-[#00d8fe] text-xl font-bold animate-pulse font-sans">GO-GETTERS</div>
      </div>
    );
  }

  const filtered = posts.filter((p) => filter === "all" || p.type === filter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await addPost(content.trim(), postType);
      setContent("");
      setPostType("win");
      setOpen(false);
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: Post["userRole"]) => {
    if (role === "admin") return "bg-purple-500/20 text-purple-400";
    if (role === "leader") return "bg-primary/20 text-primary";
    return "bg-white/5 text-muted-foreground";
  };

  return (
    <Layout>
      <div className="space-y-8 font-sans selection:bg-[#00d8fe] selection:text-black animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Community Feed
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Share wins, celebrate each other, stay fired up.</p>
          </div>
          <button 
            onClick={() => setOpen(true)}
            className="h-10 px-4 bg-primary text-black font-black uppercase text-[11px] tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} /> Share Win
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-border/20 font-medium">
          {([
            { id: "all", label: "All" },
            { id: "win", label: "Wins" },
            { id: "announcement", label: "Announcements" },
            { id: "motivation", label: "Motivation" },
            { id: "update", label: "Updates" },
          ] as { id: FilterType; label: string }[]).map((f) => (
            <button 
              key={f.id} 
              onClick={() => setFilter(f.id)} 
              className={`h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === f.id 
                  ? "bg-primary text-black" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Posts List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#16171b]/20 border border-dashed border-border/80 rounded-2xl">
            <Trophy size={40} className="mx-auto mb-3 text-muted-foreground/60 animate-pulse" />
            <p className="text-sm text-muted-foreground font-bold">Nothing to show</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Be the first to share a milestone or motivational post with the community!</p>
          </div>
        ) : (
          <div className="space-y-4.5">
            {filtered.map((post) => {
              const cfg = TYPE_CONFIG[post.type];
              const Icon = cfg.icon;
              const initials = post.userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div 
                  key={post.id} 
                  className="bg-[#16171b]/40 backdrop-blur-md rounded-2xl border border-border/85 p-5 sm:p-6 transition-all hover:border-primary/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-tr from-primary/20 to-cyan-500/20 border border-primary/20 flex items-center justify-center font-black text-primary text-sm shadow-[0_0_10px_rgba(0,216,254,0.1)]">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-foreground text-sm">{post.userName}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${getRoleBadge(post.userRole)}`}>
                          {post.userRole}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.color}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold ml-auto font-mono">{timeAgo(post.createdAt)}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{post.content}</p>
                      
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-bold font-mono">
                        <button
                          onClick={() => likePost(post.id)}
                          className={`flex items-center gap-1.5 transition-colors hover:text-red-500 cursor-pointer ${post.liked ? "text-red-500" : ""}`}
                        >
                          <Heart size={15} fill={post.liked ? "currentColor" : "none"} />
                          <span>{post.likes}</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={15} />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Share Win Dialog modal ── */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in duration-200">
              <div className="p-6 border-b border-border/60 flex items-start justify-between">
                <h2 className="text-lg font-bold text-foreground">Share with the Community</h2>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4.5 font-medium">
                  {/* Post Type Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Post Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(TYPE_CONFIG) as [PostType, typeof TYPE_CONFIG[PostType]][]).map(([type, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setPostType(type)}
                            className={`flex items-center gap-2 border rounded-lg py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              postType === type 
                                ? "border-primary bg-primary/10 text-primary" 
                                : `border-border text-muted-foreground ${cfg.hoverBorder} hover:text-foreground`
                            }`}
                          >
                            <Icon size={14} />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description / Content */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
                    <textarea
                      placeholder="What's your win today? Share it with the team..."
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      required
                      rows={4}
                      className="w-full bg-background/50 border border-border/85 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all font-sans resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="w-full h-11 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,216,254,0.4)] disabled:opacity-50 transition-all cursor-pointer mt-3"
                  >
                    {loading ? "Posting..." : "Post to Community"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
