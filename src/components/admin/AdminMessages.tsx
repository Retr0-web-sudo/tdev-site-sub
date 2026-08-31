import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Reply, Trash2, Eye, Clock, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "replied">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages((data as Message[]) || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from("messages").update({ status: "read" }).eq("id", id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "read" } : m)));
  };

  const sendReply = async (msg: Message) => {
    if (!replyText.trim()) return;
    setReplying(true);
    const { error } = await supabase
      .from("messages")
      .update({ admin_reply: replyText.trim(), replied_at: new Date().toISOString(), status: "replied" })
      .eq("id", msg.id);
    setReplying(false);
    if (error) {
      toast.error("Failed to send reply");
    } else {
      toast.success("Reply saved");
      setReplyText("");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, admin_reply: replyText.trim(), replied_at: new Date().toISOString(), status: "replied" } : m
        )
      );
    }
  };

  const deleteMsg = async (id: string) => {
    await supabase.from("messages").delete().eq("id", id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success("Message deleted");
  };

  const filtered = messages.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || m.subject.toLowerCase().includes(s);
    }
    return true;
  });

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  const statusIcon = (s: string) => {
    if (s === "unread") return <Mail size={14} className="text-accent" />;
    if (s === "replied") return <CheckCircle size={14} className="text-green-400" />;
    return <Eye size={14} className="text-muted-foreground" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-light">Messages</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {unreadCount} unread · {messages.length} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2 bg-[hsl(25,15%,12%)] border border-[hsl(25,12%,20%)] rounded-md font-body text-sm text-foreground outline-none"
          />
        </div>
        {(["all", "unread", "read", "replied"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-body text-xs px-3 py-1.5 rounded transition-colors capitalize ${
              filter === f ? "bg-accent text-accent-foreground" : "bg-[hsl(25,12%,14%)] text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">No messages found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => {
            const isExpanded = expandedId === msg.id;
            return (
              <div
                key={msg.id}
                className={`border rounded-lg transition-colors ${
                  msg.status === "unread"
                    ? "border-accent/30 bg-accent/5"
                    : "border-[hsl(25,12%,20%)] bg-[hsl(25,15%,10%)]"
                }`}
              >
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : msg.id);
                    if (msg.status === "unread") markRead(msg.id);
                    setReplyText(msg.admin_reply || "");
                  }}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  {statusIcon(msg.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body text-sm font-medium truncate">{msg.name}</span>
                      <span className="font-body text-xs text-muted-foreground truncate">{msg.email}</span>
                    </div>
                    <p className="font-body text-sm mt-0.5 truncate">{msg.subject}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Clock size={12} className="text-muted-foreground" />
                    <span className="font-body text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[hsl(25,12%,18%)] pt-4 space-y-4">
                    <div className="bg-[hsl(25,15%,8%)] rounded p-3">
                      <p className="font-body text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>

                    {msg.admin_reply && msg.replied_at && (
                      <div className="bg-accent/10 border border-accent/20 rounded p-3">
                        <p className="font-body text-xs text-accent mb-1">
                          Replied {new Date(msg.replied_at).toLocaleString()}
                        </p>
                        <p className="font-body text-sm whitespace-pre-wrap">{msg.admin_reply}</p>
                      </div>
                    )}

                    <div>
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        rows={3}
                        className="bg-[hsl(25,15%,12%)] border-[hsl(25,12%,20%)] font-body text-sm resize-none"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => sendReply(msg)}
                          disabled={replying || !replyText.trim()}
                          className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs"
                        >
                          <Reply size={12} className="mr-1" />
                          {replying ? "Sending..." : "Reply"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMsg(msg.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 font-body text-xs"
                        >
                          <Trash2 size={12} className="mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
