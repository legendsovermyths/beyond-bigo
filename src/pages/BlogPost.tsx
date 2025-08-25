import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatReadingTime } from "@/utils/blogParser";
import { BlogPost as BlogPostType } from "@/types/blog";
import InteractiveBlogRenderer from "@/components/InteractiveBlogRenderer";
import { blogManager, BLOG_CATEGORIES } from "@/lib/blogManager";
import { useSEO } from "@/hooks/useSEO";
import "@/data/blogLoader"; // Ensure blogs are loaded

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogPostType | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    // Get blog from the manager
    const foundBlog = blogManager.getBlog(slug);
    setBlog(foundBlog || null);

    // Get related blogs if blog exists
    if (foundBlog) {
      const related = blogManager.getRelatedBlogs(foundBlog, 3);
      setRelatedBlogs(related);
    }

    setLoading(false);
  }, [slug]);

  // Apply SEO data for this blog post

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The article you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/blogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-6">
            <Link to="/blogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Link>
          </Button>
        </div>

        <article>
          <header className="mb-12">
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {BLOG_CATEGORIES[blog.category as keyof typeof BLOG_CATEGORIES] || blog.category}
                </span>
              )}
              {blog.difficulty && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  blog.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  blog.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {blog.difficulty}
                </span>
              )}
              {blog.featured && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Featured
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <div className="flex items-center text-muted-foreground text-sm mb-6">
              <span>By {blog.author}</span>
              <span className="mx-2">•</span>
              <span>{formatReadingTime(blog.reading_time)}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(blog.date)}</span>
              {blog.wordCount && (
                <>
                  <span className="mx-2">•</span>
                  <span>{blog.wordCount.toLocaleString()} words</span>
                </>
              )}
            </div>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              {blog.excerpt}
            </p>
          </header>

          <InteractiveBlogRenderer content={blog.content} />

          {/* Related Articles */}
          {relatedBlogs.length > 0 && (
            <aside className="mt-16 pt-8 border-t border-border">
              <h2 className="font-display text-2xl font-semibold mb-6">Related Articles</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedBlogs.map((relatedBlog) => (
                  <Link
                    key={relatedBlog.slug}
                    to={`/blogs/${relatedBlog.slug}`}
                    className="group block p-4 border border-border rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex flex-wrap gap-1 mb-3">
                      {relatedBlog.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-display text-lg font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {relatedBlog.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {relatedBlog.excerpt}
                    </p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {formatReadingTime(relatedBlog.reading_time)} • {formatDate(relatedBlog.date)}
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </article>
      </div>
    </div>
  );
}