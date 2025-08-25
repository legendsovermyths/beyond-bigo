import { blogManager } from '@/lib/blogManager';
import patternMatchingSteroidsBlogContent from './patternMatchingSteroidsBlog.md?raw';

// Blog content imports
// As you add new blogs, import them here and add to the BLOG_SOURCES array
const BLOG_SOURCES = [
  {
    slug: 'pattern-matching-steroids',
    content: patternMatchingSteroidsBlogContent,
    lastModified: '2025-08-20'
  }
  // Add new blog imports here
  // Example:
  // {
  //   slug: 'another-blog-post',
  //   content: anotherBlogContent,
  //   lastModified: '2025-01-21'
  // }
];

let blogsLoaded = false;

/**
 * Load all blog posts into the blog manager
 * This should be called once when the app starts
 */
export function loadBlogs(): void {
  if (blogsLoaded) return;
  
  console.log('📚 Loading blog posts...');
  
  // Clear existing blogs (for hot reload support)
  blogManager.clear();
  
  // Load all blog sources
  BLOG_SOURCES.forEach(source => {
    try {
      const blog = blogManager.loadBlog(source);
      console.log(`✅ Loaded blog: ${blog.title} (${blog.slug})`);
    } catch (error) {
      console.error(`❌ Failed to load blog: ${source.slug}`, error);
    }
  });
  
  blogsLoaded = true;
  
  const stats = blogManager.getStats();
  console.log('📊 Blog loading completed:', {
    totalBlogs: stats.totalBlogs,
    totalWords: stats.totalWords,
    categories: stats.categoriesUsed,
    tags: stats.tagsUsed
  });
}

/**
 * Get all available blog slugs (for routing)
 */
export function getBlogSlugs(): string[] {
  return BLOG_SOURCES.map(source => source.slug);
}

/**
 * Check if a blog slug exists
 */
export function blogExists(slug: string): boolean {
  return BLOG_SOURCES.some(source => source.slug === slug);
}

/**
 * Hot reload support - reload all blogs in development
 */
export function reloadBlogs(): void {
  blogsLoaded = false;
  loadBlogs();
}

// Auto-load blogs when this module is imported
loadBlogs();
