import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ArrowBigUp, Send, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const DRAFT_KEY = "community_post_draft";

function saveDraft(title: string, body: string, category: string) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body, category }));
  } catch {}
}

function loadDraft(): { title: string; body: string; category: string } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d.title || d.body) return d;
  } catch {}
  return null;
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  upvote_count: number;
  reply_count: number;
  created_at: string;
  display_name: string | null;
  display_avatar_url: string | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
}

interface Reply {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name: string | null;
  display_avatar_url: string | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
}

const categories = ["All", "General", "Training Tips", "Recruiting", "Mindset"];

const categoryColors: Record<string, string> = {
  General: "bg-muted text-muted-foreground",
  "Training Tips": "bg-primary/10 text-primary",
  Recruiting: "bg-secondary/10 text-secondary",
  Mindset: "bg-pif-green/10 text-pif-green",
};

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [posting, setPosting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [replyText, setReplyText] = useState("");
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const draftRestored = useRef(false);

  // Restore draft when form opens
  useEffect(() => {
    if (showNewPost && !draftRestored.current) {
      const draft = loadDraft();
      if (draft) {
        setNewTitle(draft.title);
        setNewBody(draft.body);
        setNewCategory(draft.category || "General");
        toast.info("Draft restored");
      }
      draftRestored.current = true;
    }
    if (!showNewPost) {
      draftRestored.current = false;
    }
  }, [showNewPost]);

  // Save draft on every keystroke
  useEffect(() => {
    if (showNewPost) {
      saveDraft(newTitle, newBody, newCategory);
    }
  }, [newTitle, newBody, newCategory, showNewPost]);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("*, profiles(first_name, last_name)")
      .eq("hidden", false)
      .order("created_at", { ascending: false });
    if (data) setPosts(data as any);
  }, []);

  const fetchUserUpvotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("community_upvotes")
      .select("post_id")
      .eq("user_id", user.id);
    if (data) setUserUpvotes(new Set(data.map((u) => u.post_id)));
  }, [user]);

  useEffect(() => {
    fetchPosts();
    fetchUserUpvotes();
  }, [fetchPosts, fetchUserUpvotes]);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newBody.trim() || !user) return;
    setPosting(true);
    try {
      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        title: newTitle.trim(),
        body: newBody.trim(),
        category: newCategory,
      });
      if (error) {
        toast.error("Failed to create post. Your draft has been saved.");
        return;
      }
      clearDraft();
      setNewTitle("");
      setNewBody("");
      setShowNewPost(false);
      toast.success("Post created!");
      fetchPosts();
    } catch (err) {
      console.error("Post creation error:", err);
      toast.error("Something went wrong. Your draft has been saved.");
    } finally {
      setPosting(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!user) return;
    if (userUpvotes.has(postId)) {
      await supabase.from("community_upvotes").delete().eq("user_id", user.id).eq("post_id", postId);
      setUserUpvotes((prev) => { const s = new Set(prev); s.delete(postId); return s; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, upvote_count: p.upvote_count - 1 } : p));
    } else {
      await supabase.from("community_upvotes").insert({ user_id: user.id, post_id: postId });
      setUserUpvotes((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, upvote_count: p.upvote_count + 1 } : p));
    }
  };

  const toggleReplies = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!replies[postId]) {
      const { data } = await supabase
        .from("community_replies")
        .select("*, profiles(first_name, last_name)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (data) setReplies((prev) => ({ ...prev, [postId]: data as any }));
    }
  };

  const handleReply = async (postId: string) => {
    if (!replyText.trim() || !user) return;
    const { error } = await supabase.from("community_replies").insert({
      post_id: postId,
      user_id: user.id,
      body: replyText.trim(),
    });
    if (error) {
      toast.error("Failed to reply");
    } else {
      setReplyText("");
      // Refresh replies
      const { data } = await supabase
        .from("community_replies")
        .select("*, profiles(first_name, last_name)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (data) setReplies((prev) => ({ ...prev, [postId]: data as any }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reply_count: p.reply_count + 1 } : p));
    }
  };

  const filtered = posts.filter((p) => activeCategory === "All" || p.category === activeCategory);

  const getDisplayName = (post: Post) => {
    if (post.display_name) return post.display_name;
    if (!post.profiles) return "Unknown";
    return `${post.profiles.first_name || ""} ${post.profiles.last_name || ""}`.trim() || "Unknown";
  };

  const getInitials = (profile: { first_name: string | null; last_name: string | null } | null, displayName?: string | null) => {
    if (displayName) {
      const parts = displayName.trim().split(/\s+/);
      return parts.map(p => p[0] || "").join("").toUpperCase().slice(0, 2) || "?";
    }
    if (!profile) return "?";
    return `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase() || "?";
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading text-foreground">Community</h1>
            <p className="text-muted-foreground mt-1">Connect with fellow athletes and coaches</p>
          </div>
          <Button onClick={() => setShowNewPost(!showNewPost)} className="btn-cta bg-primary hover:bg-primary/90 glow-red-hover">
            {showNewPost ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showNewPost ? "Cancel" : "New Post"}
          </Button>
        </div>

        {/* New Post Form */}
        <AnimatePresence>
          {showNewPost && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card className="bg-card border-border">
                <CardContent className="p-5 space-y-4">
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Post title..." className="bg-muted border-border h-12 font-heading text-lg" />
                  <Textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Share your thoughts, ask a question..." className="bg-muted border-border min-h-[100px]" />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {categories.filter((c) => c !== "All").map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setNewCategory(cat)}
                          className={`px-3 py-1 rounded-lg text-xs font-heading tracking-wider transition-all ${
                            newCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <Button onClick={handleCreatePost} disabled={posting || !newTitle.trim() || !newBody.trim()} className="bg-primary hover:bg-primary/90">
                      <Send className="h-4 w-4 mr-2" /> Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading tracking-wider transition-all ${
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No posts yet. Be the first to start a conversation!</p>
            </div>
          )}
          {filtered.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="bg-card border-border hover:border-primary/10 transition-all">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Upvote */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button
                        onClick={() => handleUpvote(post.id)}
                        className={`p-1 rounded transition-colors ${
                          userUpvotes.has(post.id) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <ArrowBigUp className="h-6 w-6" fill={userUpvotes.has(post.id) ? "currentColor" : "none"} />
                      </button>
                      <span className="text-sm font-heading text-foreground">{post.upvote_count}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                        {post.display_avatar_url ? (
                          <img src={post.display_avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[10px] font-heading text-primary">{getInitials(post.profiles, post.display_name)}</span>
                          </div>
                        )}
                        <span className="text-sm text-foreground">{getDisplayName(post)}</span>
                        <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading tracking-wider ${categoryColors[post.category] || "bg-muted text-muted-foreground"}`}>
                          {post.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-heading font-medium normal-case text-foreground">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{post.body}</p>
                      <button
                        onClick={() => toggleReplies(post.id)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {post.reply_count} {post.reply_count === 1 ? "reply" : "replies"}
                        {expandedPost === post.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {/* Replies */}
                      <AnimatePresence>
                        {expandedPost === post.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-3 border-t border-border mt-3">
                            {(replies[post.id] || []).map((reply) => (
                              <div key={reply.id} className="flex gap-3 pl-2">
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-heading text-muted-foreground">{getInitials(reply.profiles)}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">{reply.profiles?.first_name} {reply.profiles?.last_name}</span>
                                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5">{reply.body}</p>
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-2 pt-2">
                              <Input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="bg-muted border-border h-9 text-sm"
                                onKeyDown={(e) => e.key === "Enter" && handleReply(post.id)}
                              />
                              <Button size="sm" onClick={() => handleReply(post.id)} disabled={!replyText.trim()} className="bg-primary hover:bg-primary/90 h-9">
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
