import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import Seo from "@/components/Seo";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_name: string | null;
  tags: string[] | null;
  created_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Journal — TDEV" description="Stories, style notes, and updates from TDEV." path="/blog" />
      <Navbar />
      <main className="pt-28 pb-20 section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">Journal</h1>
          <p className="font-body text-sm text-muted-foreground mb-12">
            Stories, style notes, and updates from TDEV
          </p>

          {loading && (
            <p className="text-muted-foreground font-body text-sm text-center py-20">Loading…</p>
          )}

          {!loading && posts.length === 0 && (
            <p className="text-muted-foreground font-body text-sm text-center py-20">
              No posts yet. Check back soon.
            </p>
          )}

          <div className="space-y-12">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/blog/${post.slug}`} className="group block">
                  {post.cover_image && (
                    <div className="aspect-[2/1] overflow-hidden mb-5 bg-secondary">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-3">
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
                  <h2 className="font-display text-2xl md:text-3xl text-foreground group-hover:text-accent transition-colors duration-300 mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {post.tags.map((tag) => (
                        <span key={tag} className="font-body text-[9px] tracking-wider uppercase text-muted-foreground bg-muted px-2.5 py-1 rounded-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
