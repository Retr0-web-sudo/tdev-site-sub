import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, Trash2, Edit, Eye, EyeOff, ArrowLeft, Sparkles, RefreshCw,
  Tag, Image, FileText, Loader2, Wand2, X, ChevronDown, ChevronUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { slugify } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  published: boolean;
  author_name: string | null;
  tags: string[] | null;
  created_at: string;
}

const EMPTY_POST: BlogPost = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  published: false,
  author_name: "TDEV",
  tags: [],
  created_at: new Date().toISOString(),
};

// --- AI streaming helper ---
async function streamBlogAI(
  body: Record<string, unknown>,
  onDelta: (t: string) => void,
  onDone: () => void,
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-ai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    },
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await resp.json();
    if (data.result) onDelta(data.result);
    onDone();
    return;
  }

  // SSE stream
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {}
    }
  }
  onDone();
}

// --- Tag Chip ---
const TagChip = ({ tag, onRemove }: { tag: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 bg-accent/15 text-accent px-2.5 py-1 rounded-full font-body text-[10px] tracking-wider uppercase">
    {tag}
    <button onClick={onRemove} className="hover:text-destructive transition-colors">
      <X size={10} />
    </button>
  </span>
);

// --- Section Editor ---
const SectionEditor = ({
  index,
  heading,
  body,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  index: number;
  heading: string;
  body: string;
  onUpdate: (h: string, b: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => (
  <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
    <div className="flex items-center gap-2">
      <span className="font-body text-[10px] tracking-wider uppercase text-muted-foreground shrink-0">
        Section {index + 1}
      </span>
      <div className="flex-1" />
      <button onClick={onMoveUp} disabled={isFirst} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"><ChevronUp size={14} /></button>
      <button onClick={onMoveDown} disabled={isLast} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"><ChevronDown size={14} /></button>
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
    </div>
    <Input
      value={heading}
      onChange={(e) => onUpdate(e.target.value, body)}
      placeholder="Section heading…"
      className="bg-background border-border font-display text-lg"
    />
    <Textarea
      value={body}
      onChange={(e) => onUpdate(heading, e.target.value)}
      placeholder="Write this section's content…"
      rows={5}
      className="bg-background border-border font-body text-sm leading-relaxed"
    />
  </div>
);

// --- Helpers to split/join markdown sections ---
function contentToSections(content: string): Array<{ heading: string; body: string }> {
  if (!content.trim()) return [{ heading: "", body: "" }];
  const parts = content.split(/^## /m);
  const sections: Array<{ heading: string; body: string }> = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part && i === 0) continue;
    if (i === 0) {
      sections.push({ heading: "", body: part });
    } else {
      const nl = part.indexOf("\n");
      if (nl === -1) {
        sections.push({ heading: part, body: "" });
      } else {
        sections.push({ heading: part.slice(0, nl).trim(), body: part.slice(nl + 1).trim() });
      }
    }
  }
  return sections.length ? sections : [{ heading: "", body: "" }];
}

function sectionsToContent(sections: Array<{ heading: string; body: string }>): string {
  return sections
    .map((s) => {
      if (s.heading) return `## ${s.heading}\n\n${s.body}`;
      return s.body;
    })
    .join("\n\n");
}

// ===================== MAIN COMPONENT =====================
const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [sections, setSections] = useState<Array<{ heading: string; body: string }>>([{ heading: "", body: "" }]);
  const [tagInput, setTagInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null); // action name

  const fetchPosts = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const openEditor = (post: BlogPost) => {
    setEditing(post);
    setSections(contentToSections(post.content));
    setPreviewMode(false);
  };

  const createNew = () => openEditor({ ...EMPTY_POST });

  const closeEditor = () => {
    setEditing(null);
    setSections([{ heading: "", body: "" }]);
    setPreviewMode(false);
  };

  const getContent = useCallback(() => sectionsToContent(sections), [sections]);

  const savePost = async () => {
    if (!editing) return;
    const content = getContent();
    const slug = editing.slug || slugify(editing.title);
    const payload = {
      title: editing.title,
      slug,
      excerpt: editing.excerpt || null,
      content,
      cover_image: editing.cover_image || null,
      published: editing.published,
      author_name: editing.author_name || "TDEV",
      tags: editing.tags || [],
    };

    if (editing.id) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Post updated");
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Post created");
    }
    closeEditor();
    fetchPosts();
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Post deleted");
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePublish = async (post: BlogPost) => {
    const { error } = await supabase.from("blog_posts").update({ published: !post.published }).eq("id", post.id);
    if (error) { toast.error(error.message); return; }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published: !p.published } : p)));
  };

  // --- Section management ---
  const updateSection = (i: number, h: string, b: string) => {
    setSections((prev) => prev.map((s, j) => (j === i ? { heading: h, body: b } : s)));
  };
  const addSection = () => setSections((prev) => [...prev, { heading: "", body: "" }]);
  const removeSection = (i: number) => setSections((prev) => prev.filter((_, j) => j !== i));
  const moveSection = (i: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  };

  // --- Tag management ---
  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t || !editing) return;
    if (editing.tags?.includes(t)) return;
    setEditing({ ...editing, tags: [...(editing.tags || []), t] });
    setTagInput("");
  };
  const removeTag = (tag: string) => {
    if (!editing) return;
    setEditing({ ...editing, tags: (editing.tags || []).filter((t) => t !== tag) });
  };

  // --- AI actions ---
  const aiGenerate = async () => {
    if (!editing?.title) { toast.error("Enter a title first"); return; }
    setAiLoading("generate");
    let result = "";
    try {
      await streamBlogAI(
        { action: "generate", title: editing.title },
        (chunk) => { result += chunk; setSections(contentToSections(result)); },
        () => {},
      );
      toast.success("Draft generated!");
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally {
      setAiLoading(null);
    }
  };

  const aiRewrite = async () => {
    const content = getContent();
    if (!content.trim()) { toast.error("Write some content first"); return; }
    setAiLoading("rewrite");
    let result = "";
    try {
      await streamBlogAI(
        { action: "rewrite", content },
        (chunk) => { result += chunk; setSections(contentToSections(result)); },
        () => {},
      );
      toast.success("Content rewritten!");
    } catch (e: any) {
      toast.error(e.message || "AI rewrite failed");
    } finally {
      setAiLoading(null);
    }
  };

  const aiSuggestTags = async () => {
    if (!editing) return;
    setAiLoading("tags");
    try {
      let result = "";
      await streamBlogAI(
        { action: "suggest_tags", title: editing.title, content: getContent() },
        (chunk) => { result += chunk; },
        () => {},
      );
      const tags = JSON.parse(result);
      if (Array.isArray(tags)) {
        setEditing({ ...editing, tags: [...new Set([...(editing.tags || []), ...tags])] });
        toast.success("Tags suggested!");
      }
    } catch (e: any) {
      toast.error(e.message || "Tag suggestion failed");
    } finally {
      setAiLoading(null);
    }
  };

  const aiGenerateExcerpt = async () => {
    if (!editing) return;
    setAiLoading("excerpt");
    try {
      let result = "";
      await streamBlogAI(
        { action: "generate_excerpt", title: editing.title, content: getContent() },
        (chunk) => { result += chunk; },
        () => {},
      );
      setEditing({ ...editing, excerpt: result.trim() });
      toast.success("Excerpt generated!");
    } catch (e: any) {
      toast.error(e.message || "Excerpt generation failed");
    } finally {
      setAiLoading(null);
    }
  };

  // ===================== EDITOR VIEW =====================
  if (editing) {
    const content = getContent();
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={closeEditor} className="inline-flex items-center gap-2 font-body text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Back to posts
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="font-body text-xs gap-1.5 border-border"
            >
              {previewMode ? <Edit size={13} /> : <Eye size={13} />}
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button onClick={savePost} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider">
              {editing.id ? "Update" : "Create"}
            </Button>
          </div>
        </div>

        {previewMode ? (
          /* ---- PREVIEW ---- */
          <div className="border border-border rounded-lg bg-card p-6 max-w-3xl mx-auto">
            {editing.cover_image && (
              <div className="aspect-[2/1] overflow-hidden mb-6 rounded-md bg-secondary">
                <img src={editing.cover_image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="font-display text-3xl text-card-foreground mb-2">{editing.title || "Untitled"}</h1>
            {editing.excerpt && (
              <p className="font-body text-sm text-muted-foreground mb-4 italic">{editing.excerpt}</p>
            )}
            {editing.tags && editing.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {editing.tags.map((t) => (
                  <span key={t} className="font-body text-[9px] tracking-wider uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-sm">{t}</span>
                ))}
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none font-body text-card-foreground/85 leading-relaxed">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          /* ---- EDIT MODE ---- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content — 2/3 */}
            <div className="lg:col-span-2 space-y-5">
              {/* Title */}
              <div>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
                  placeholder="Post title…"
                  className="bg-card border-border font-display text-2xl h-14 px-4"
                />
              </div>

              {/* AI bar */}
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-accent/5 border border-accent/15">
                <span className="font-body text-[10px] tracking-wider uppercase text-accent self-center mr-1 flex items-center gap-1">
                  <Sparkles size={12} /> AI Tools
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={aiGenerate}
                  disabled={!!aiLoading}
                  className="font-body text-[11px] border-accent/25 text-accent hover:bg-accent/10 gap-1.5"
                >
                  {aiLoading === "generate" ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Generate Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={aiRewrite}
                  disabled={!!aiLoading}
                  className="font-body text-[11px] border-accent/25 text-accent hover:bg-accent/10 gap-1.5"
                >
                  {aiLoading === "rewrite" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Rewrite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={aiSuggestTags}
                  disabled={!!aiLoading}
                  className="font-body text-[11px] border-accent/25 text-accent hover:bg-accent/10 gap-1.5"
                >
                  {aiLoading === "tags" ? <Loader2 size={12} className="animate-spin" /> : <Tag size={12} />}
                  Suggest Tags
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={aiGenerateExcerpt}
                  disabled={!!aiLoading}
                  className="font-body text-[11px] border-accent/25 text-accent hover:bg-accent/10 gap-1.5"
                >
                  {aiLoading === "excerpt" ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                  Auto Excerpt
                </Button>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                {sections.map((s, i) => (
                  <SectionEditor
                    key={i}
                    index={i}
                    heading={s.heading}
                    body={s.body}
                    onUpdate={(h, b) => updateSection(i, h, b)}
                    onRemove={() => removeSection(i)}
                    onMoveUp={() => moveSection(i, -1)}
                    onMoveDown={() => moveSection(i, 1)}
                    isFirst={i === 0}
                    isLast={i === sections.length - 1}
                  />
                ))}
                <Button
                  variant="outline"
                  onClick={addSection}
                  className="w-full border-dashed border-border text-muted-foreground hover:text-foreground font-body text-xs gap-1.5"
                >
                  <Plus size={14} /> Add Section
                </Button>
              </div>
            </div>

            {/* Sidebar — 1/3 */}
            <div className="space-y-5">
              {/* Cover Image */}
              <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
                <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                  <Image size={12} /> Cover Image
                </Label>
                {editing.cover_image && (
                  <div className="aspect-[2/1] overflow-hidden rounded-md bg-secondary">
                    <img src={editing.cover_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <Input
                  value={editing.cover_image || ""}
                  onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })}
                  placeholder="https://…"
                  className="bg-background border-border font-body text-sm"
                />
              </div>

              {/* Excerpt */}
              <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
                <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Excerpt</Label>
                <Textarea
                  value={editing.excerpt || ""}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  rows={3}
                  placeholder="A short summary…"
                  className="bg-background border-border font-body text-sm"
                />
              </div>

              {/* Slug */}
              <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
                <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Slug</Label>
                <div className="flex gap-2">
                  <Input
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    className="bg-background border-border font-body text-sm flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing((prev) => prev ? ({ ...prev, slug: slugify(prev.title) }) : prev)} className="border-border text-muted-foreground font-body text-xs gap-1 shrink-0" title="Regenerate from title">
                    <Wand2 size={12} /> Auto
                  </Button>
                </div>
              </div>

              {/* Author */}
              <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
                <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Author</Label>
                <Input
                  value={editing.author_name || ""}
                  onChange={(e) => setEditing({ ...editing, author_name: e.target.value })}
                  className="bg-background border-border font-body text-sm"
                />
              </div>

              {/* Tags */}
              <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
                <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                  <Tag size={12} /> Tags
                </Label>
                {editing.tags && editing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editing.tags.map((t) => <TagChip key={t} tag={t} onRemove={() => removeTag(t)} />)}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                    placeholder="Add tag…"
                    className="bg-background border-border font-body text-sm flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => addTag(tagInput)} className="border-border shrink-0">
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Publish toggle */}
              <div className="border border-border rounded-lg p-4 bg-card/50 flex items-center justify-between">
                <span className="font-body text-xs tracking-wider uppercase text-muted-foreground">
                  {editing.published ? "Published" : "Draft"}
                </span>
                <Switch
                  checked={editing.published}
                  onCheckedChange={(published) => setEditing({ ...editing, published })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===================== LIST VIEW =====================
  if (loading) return <p className="text-muted-foreground font-body text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-card-foreground">Blog Posts</h2>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Create and manage blog content
          </p>
        </div>
        <Button onClick={createNew} size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={14} /> New Post
        </Button>
      </div>

      {posts.length === 0 && (
        <p className="text-muted-foreground font-body text-sm py-8 text-center">
          No blog posts yet. Click "New Post" to create one.
        </p>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="border border-border rounded-lg p-4 bg-card flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-sm text-card-foreground truncate">{post.title}</h3>
                <span className={`shrink-0 font-body text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full ${
                  post.published ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                }`}>
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="font-body text-xs text-muted-foreground truncate">
                {post.excerpt || "No excerpt"}
              </p>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {post.tags.slice(0, 4).map((t) => (
                    <span key={t} className="font-body text-[8px] tracking-wider uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{t}</span>
                  ))}
                  {post.tags.length > 4 && (
                    <span className="font-body text-[8px] text-muted-foreground">+{post.tags.length - 4}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => togglePublish(post)} title={post.published ? "Unpublish" : "Publish"}>
                {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEditor(post)}>
                <Edit size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)} className="text-destructive hover:text-destructive">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBlog;
