import { BlogPost, BlogFilter, BlogSortOptions } from '@/types/blog';
import { parseBlogPost } from '@/utils/blogParser';

// Blog category definitions
export const BLOG_CATEGORIES = {
  'algorithms': 'Algorithms',
  'data-structures': 'Data Structures',
  'machine-learning': 'Machine Learning',
  'system-design': 'System Design',
  'mathematics': 'Mathematics',
  'computational-complexity': 'Computational Complexity',
  'programming': 'Programming',
  'theory': 'Theory'
} as const;

type BlogCategory = keyof typeof BLOG_CATEGORIES;

interface BlogSource {
  slug: string;
  content: string;
  lastModified?: string;
}

class BlogManager {
  private blogs = new Map<string, BlogPost>();
  private categoryMap = new Map<string, Set<string>>();
  private tagMap = new Map<string, Set<string>>();
  private authorMap = new Map<string, Set<string>>();

  /**
   * Load a blog from source content
   */
  loadBlog(source: BlogSource): BlogPost {
    const blog = parseBlogPost(source.content, source.slug);
    
    // Add computed properties
    blog.wordCount = this.countWords(blog.content);
    blog.lastModified = source.lastModified || blog.date;
    blog.published = blog.published !== false; // Default to published
    
    this.addBlog(blog);
    return blog;
  }

  /**
   * Add a blog to the manager
   */
  private addBlog(blog: BlogPost): void {
    this.blogs.set(blog.slug, blog);
    this.updateIndices(blog);
  }

  /**
   * Update search indices when a blog is added
   */
  private updateIndices(blog: BlogPost): void {
    // Category index
    if (blog.category) {
      if (!this.categoryMap.has(blog.category)) {
        this.categoryMap.set(blog.category, new Set());
      }
      this.categoryMap.get(blog.category)!.add(blog.slug);
    }

    // Tag index
    blog.tags.forEach(tag => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(blog.slug);
    });

    // Author index
    if (!this.authorMap.has(blog.author)) {
      this.authorMap.set(blog.author, new Set());
    }
    this.authorMap.get(blog.author)!.add(blog.slug);
  }

  /**
   * Get a blog by slug
   */
  getBlog(slug: string): BlogPost | undefined {
    return this.blogs.get(slug);
  }

  /**
   * Get all blogs with optional filtering and sorting
   */
  getBlogs(filter?: BlogFilter, sort?: BlogSortOptions): BlogPost[] {
    let filteredBlogs = Array.from(this.blogs.values());

    // Apply filters
    if (filter) {
      filteredBlogs = filteredBlogs.filter(blog => {
        // Published filter
        if (filter.published !== undefined && blog.published !== filter.published) {
          return false;
        }

        // Featured filter
        if (filter.featured !== undefined && blog.featured !== filter.featured) {
          return false;
        }

        // Category filter
        if (filter.category && blog.category !== filter.category) {
          return false;
        }

        // Author filter
        if (filter.author && blog.author !== filter.author) {
          return false;
        }

        // Difficulty filter
        if (filter.difficulty && blog.difficulty !== filter.difficulty) {
          return false;
        }

        // Tags filter (blog must have all specified tags)
        if (filter.tags && filter.tags.length > 0) {
          const blogTags = new Set(blog.tags);
          if (!filter.tags.every(tag => blogTags.has(tag))) {
            return false;
          }
        }

        return true;
      });
    }

    // Apply sorting
    if (sort) {
      filteredBlogs.sort((a, b) => {
        let valueA: any;
        let valueB: any;

        switch (sort.field) {
          case 'date':
            valueA = new Date(a.date).getTime();
            valueB = new Date(b.date).getTime();
            break;
          case 'lastModified':
            valueA = new Date(a.lastModified || a.date).getTime();
            valueB = new Date(b.lastModified || b.date).getTime();
            break;
          case 'title':
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
            break;
          case 'reading_time':
            valueA = a.reading_time;
            valueB = b.reading_time;
            break;
          default:
            return 0;
        }

        if (valueA < valueB) return sort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filteredBlogs;
  }

  /**
   * Get blogs by category
   */
  getBlogsByCategory(category: string): BlogPost[] {
    const slugs = this.categoryMap.get(category) || new Set();
    return Array.from(slugs)
      .map(slug => this.blogs.get(slug))
      .filter((blog): blog is BlogPost => blog !== undefined);
  }

  /**
   * Get blogs by tag
   */
  getBlogsByTag(tag: string): BlogPost[] {
    const slugs = this.tagMap.get(tag) || new Set();
    return Array.from(slugs)
      .map(slug => this.blogs.get(slug))
      .filter((blog): blog is BlogPost => blog !== undefined);
  }

  /**
   * Get blogs by author
   */
  getBlogsByAuthor(author: string): BlogPost[] {
    const slugs = this.authorMap.get(author) || new Set();
    return Array.from(slugs)
      .map(slug => this.blogs.get(slug))
      .filter((blog): blog is BlogPost => blog !== undefined);
  }

  /**
   * Get featured blogs
   */
  getFeaturedBlogs(): BlogPost[] {
    return this.getBlogs({ featured: true }, { field: 'date', direction: 'desc' });
  }

  /**
   * Get recent blogs
   */
  getRecentBlogs(limit = 5): BlogPost[] {
    return this.getBlogs(
      { published: true }, 
      { field: 'date', direction: 'desc' }
    ).slice(0, limit);
  }

  /**
   * Search blogs by content
   */
  searchBlogs(query: string): BlogPost[] {
    const searchTerm = query.toLowerCase();
    return this.getBlogs({ published: true }).filter(blog => {
      return (
        blog.title.toLowerCase().includes(searchTerm) ||
        blog.excerpt.toLowerCase().includes(searchTerm) ||
        blog.content.toLowerCase().includes(searchTerm) ||
        blog.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        blog.author.toLowerCase().includes(searchTerm) ||
        (blog.category && blog.category.toLowerCase().includes(searchTerm))
      );
    });
  }

  /**
   * Get related blogs based on tags and category
   */
  getRelatedBlogs(blog: BlogPost, limit = 3): BlogPost[] {
    const relatedBlogs = this.getBlogs({ published: true })
      .filter(b => b.slug !== blog.slug)
      .map(b => ({
        blog: b,
        score: this.calculateRelatedness(blog, b)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.blog);

    return relatedBlogs;
  }

  /**
   * Calculate relatedness score between two blogs
   */
  private calculateRelatedness(blogA: BlogPost, blogB: BlogPost): number {
    let score = 0;

    // Same category gets high score
    if (blogA.category && blogA.category === blogB.category) {
      score += 3;
    }

    // Common tags get medium score
    const commonTags = blogA.tags.filter(tag => blogB.tags.includes(tag));
    score += commonTags.length * 2;

    // Same author gets low score
    if (blogA.author === blogB.author) {
      score += 1;
    }

    return score;
  }

  /**
   * Get all categories with blog counts
   */
  getCategories(): { category: string; name: string; count: number }[] {
    return Object.entries(BLOG_CATEGORIES).map(([category, name]) => ({
      category,
      name,
      count: this.categoryMap.get(category)?.size || 0
    }));
  }

  /**
   * Get all tags with usage counts
   */
  getTags(): { tag: string; count: number }[] {
    return Array.from(this.tagMap.entries())
      .map(([tag, slugs]) => ({ tag, count: slugs.size }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get all authors with blog counts
   */
  getAuthors(): { author: string; count: number }[] {
    return Array.from(this.authorMap.entries())
      .map(([author, slugs]) => ({ author, count: slugs.size }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get blog statistics
   */
  getStats() {
    const publishedBlogs = this.getBlogs({ published: true });
    const totalWords = publishedBlogs.reduce((sum, blog) => sum + (blog.wordCount || 0), 0);
    const totalReadingTime = publishedBlogs.reduce((sum, blog) => sum + blog.reading_time, 0);

    return {
      totalBlogs: publishedBlogs.length,
      draftBlogs: this.getBlogs({ published: false }).length,
      featuredBlogs: this.getBlogs({ featured: true }).length,
      totalWords,
      totalReadingTime,
      averageReadingTime: publishedBlogs.length > 0 ? Math.round(totalReadingTime / publishedBlogs.length) : 0,
      categoriesUsed: this.getCategories().filter(c => c.count > 0).length,
      tagsUsed: this.getTags().length,
      authorsCount: this.getAuthors().length
    };
  }

  /**
   * Count words in text content
   */
  private countWords(content: string): number {
    // Remove markdown syntax and count words
    const plainText = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Extract link text
      .replace(/[*_]{1,2}([^*_]*)[*_]{1,2}/g, '$1') // Remove emphasis
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .trim();

    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Clear all blogs (useful for testing)
   */
  clear(): void {
    this.blogs.clear();
    this.categoryMap.clear();
    this.tagMap.clear();
    this.authorMap.clear();
  }
}

// Create singleton instance
export const blogManager = new BlogManager();

export default blogManager;
