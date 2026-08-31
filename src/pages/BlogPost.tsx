import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Seo from "@/components/Seo";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  author_name: string | null;
  tags: string[] | null;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-20 section-padding text-center">
          <p className="text-muted-foreground font-body text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-20 section-padding text-center">
          <p className="font-display text-2xl text-foreground mb-4">Post not found</p>
          <Link to="/blog" className="font-body text-sm text-accent hover:underline">
            ← Back to Journal
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${post.title} — TDEV Journal`}
        description={(post as any).excerpt ?? post.content.replace(/[#*_>`\-]/g, "").replace(/\s+/g, " ").slice(0, 160)}
        path={`/blog/${post.slug}`}
        image={post.cover_image ?? undefined}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          datePublished: post.created_at,
          author: { "@type": "Person", name: post.author_name ?? "TDEV" },
          image: post.cover_image ?? undefined,
          mainEntityOfPage:
            typeof window !== "undefined"
              ? `${window.location.origin}/blog/${post.slug}`
              : `/blog/${post.slug}`,
        }}
      />
      <Navbar />
      <main className="pt-28 pb-20 section-padding">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-body text-xs tracking-wider uppercase text-muted-foreground hover:text-accent transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to Journal
          </Link>

          {post.cover_image && (
            <div className="aspect-[2/1] overflow-hidden mb-8 bg-secondary rounded-md">
              <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-center gap-4 mb-4">
            <span className="font-body text-[10px] tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
              <Calendar size={11} />
              {new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            {post.author_name && (
              <span className="font-body text-[10px] tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                <User size={11} />
                {post.author_name}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-5xl text-foreground mb-8 leading-tight">
            {post.title}
          </h1>

          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mb-8">
              {post.tags.map((tag) => (
                <span key={tag} className="font-body text-[9px] tracking-wider uppercase text-muted-foreground bg-muted px-2.5 py-1 rounded-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none font-body text-foreground/85 leading-relaxed">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </motion.article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
