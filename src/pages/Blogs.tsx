import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDate, formatReadingTime } from "@/utils/blogParser";
import { BlogPost, BlogFilter, BlogSortOptions } from "@/types/blog";
import { blogManager, BLOG_CATEGORIES } from "@/lib/blogManager";
import { useSEO } from "@/hooks/useSEO";
import "@/data/blogLoader"; // Ensure blogs are loaded

export default function Blogs() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filter, setFilter] = useState<BlogFilter>({ published: true });
  const [sort, setSort] = useState<BlogSortOptions>({ field: 'date', direction: 'desc' });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  useEffect(() => {
    // Get blogs from the manager with current filter and sort
    const currentFilter: BlogFilter = {
      ...filter,
      ...(selectedCategory && { category: selectedCategory }),
      ...(selectedTag && { tags: [selectedTag] })
    };
    
    const filteredBlogs = blogManager.getBlogs(currentFilter, sort);
    setBlogs(filteredBlogs);
  }, [filter, sort, selectedCategory, selectedTag]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            All Articles
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Deep dives into algorithms, theory, and computational thinking
          </p>
        </header>

        {/* Filters and Sorting */}
        <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">All Categories</option>
              {Object.entries(BLOG_CATEGORIES).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">All Tags</option>
              {blogManager.getTags().map(({ tag }) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {(selectedCategory || selectedTag) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedTag('');
                }}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={`${sort.field}-${sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [BlogSortOptions['field'], BlogSortOptions['direction']];
                setSort({ field, direction });
              }}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="reading_time-asc">Shortest Read</option>
              <option value="reading_time-desc">Longest Read</option>
            </select>
          </div>
        </div>

        <div className="space-y-8">
          {blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                No articles yet. Check back soon for algorithmic adventures!
              </p>
            </div>
          ) : (
            blogs.map((blog) => (
              <article
                key={blog.slug}
                className="bg-card border border-border rounded-lg p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4 hover:text-primary transition-colors">
                  <Link to={`/blogs/${blog.slug}`}>
                    {blog.title}
                  </Link>
                </h2>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {blog.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span>By {blog.author}</span>
                    <span className="mx-2">•</span>
                    <span>{formatReadingTime(blog.reading_time)}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(blog.date)}</span>
                  </div>
                  <Link
                    to={`/blogs/${blog.slug}`}
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}