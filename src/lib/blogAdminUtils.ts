import { blogManager } from './blogManager';
import { demoRegistry } from './demoRegistry';

/**
 * Admin utilities for managing blogs and demos
 * These functions provide helpful information for content creators
 */

export interface BlogStats {
  totalBlogs: number;
  draftBlogs: number;
  featuredBlogs: number;
  totalWords: number;
  totalReadingTime: number;
  averageReadingTime: number;
  categoriesUsed: number;
  tagsUsed: number;
  authorsCount: number;
  popularTags: { tag: string; count: number }[];
  categoryDistribution: { category: string; name: string; count: number }[];
}

export interface DemoStats {
  totalDemos: number;
  categoriesUsed: number;
  categoryDistribution: { category: string; name: string; count: number }[];
  unusedDemos: string[]; // Demos not referenced in any blog
}

/**
 * Get comprehensive blog statistics
 */
export function getBlogStats(): BlogStats {
  const baseStats = blogManager.getStats();
  const tags = blogManager.getTags().slice(0, 10); // Top 10 tags
  const categories = blogManager.getCategories();
  
  return {
    ...baseStats,
    popularTags: tags,
    categoryDistribution: categories
  };
}

/**
 * Get comprehensive demo statistics
 */
export function getDemoStats(): DemoStats {
  const allDemos = demoRegistry.getAll();
  const categories = demoRegistry.getCategories();
  
  // Find demos not referenced in any blog
  const allBlogs = blogManager.getBlogs({ published: true });
  const referencedDemoIds = new Set<string>();
  
  allBlogs.forEach(blog => {
    blog.related_demos?.forEach(demoId => {
      referencedDemoIds.add(demoId);
    });
  });
  
  const unusedDemos = allDemos
    .filter(demo => !referencedDemoIds.has(demo.id))
    .map(demo => demo.id);
  
  return {
    totalDemos: allDemos.length,
    categoriesUsed: categories.filter(c => c.count > 0).length,
    categoryDistribution: categories,
    unusedDemos
  };
}

/**
 * Validate blog frontmatter and content
 */
export function validateBlog(content: string, slug: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Check if blog can be parsed
    const blog = blogManager.getBlog(slug);
    if (!blog) {
      errors.push('Blog could not be loaded or parsed');
      return { isValid: false, errors, warnings };
    }
    
    // Validate required fields
    if (!blog.title.trim()) errors.push('Title is required');
    if (!blog.date.trim()) errors.push('Date is required');
    if (!blog.author.trim()) errors.push('Author is required');
    if (!blog.excerpt.trim()) errors.push('Excerpt is required');
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(blog.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }
    
    // Check reading time estimate
    if (blog.wordCount && blog.reading_time) {
      const estimatedTime = Math.ceil(blog.wordCount / 200); // 200 WPM
      const difference = Math.abs(estimatedTime - blog.reading_time);
      if (difference > 5) {
        warnings.push(`Reading time (${blog.reading_time}min) differs significantly from word count estimate (${estimatedTime}min)`);
      }
    }
    
    // Check for missing tags
    if (blog.tags.length === 0) {
      warnings.push('No tags specified - consider adding tags for better discoverability');
    }
    
    // Validate demo references
    if (blog.related_demos) {
      blog.related_demos.forEach(demoId => {
        if (!demoRegistry.has(demoId)) {
          errors.push(`Referenced demo '${demoId}' does not exist`);
        }
      });
    }
    
    // Check for demo directives in content
    const demoDirectiveRegex = /:::demo-([a-z-]+)/g;
    const contentDemos = [...content.matchAll(demoDirectiveRegex)].map(match => match[1]);
    contentDemos.forEach(demoId => {
      if (!demoRegistry.has(demoId)) {
        errors.push(`Demo '${demoId}' used in content but not registered`);
      }
    });
    
    // Check if content demos are listed in related_demos
    const relatedDemos = new Set(blog.related_demos || []);
    contentDemos.forEach(demoId => {
      if (!relatedDemos.has(demoId)) {
        warnings.push(`Demo '${demoId}' used in content but not listed in related_demos`);
      }
    });
    
  } catch (error) {
    errors.push(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate a content report for all blogs
 */
export function generateContentReport(): {
  blogStats: BlogStats;
  demoStats: DemoStats;
  issues: Array<{
    slug: string;
    title: string;
    type: 'error' | 'warning';
    message: string;
  }>;
} {
  const blogStats = getBlogStats();
  const demoStats = getDemoStats();
  const issues: Array<{
    slug: string;
    title: string;
    type: 'error' | 'warning';
    message: string;
  }> = [];
  
  // Check all blogs for issues
  const allBlogs = blogManager.getBlogs();
  allBlogs.forEach(blog => {
    const validation = validateBlog(blog.content, blog.slug);
    
    validation.errors.forEach(error => {
      issues.push({
        slug: blog.slug,
        title: blog.title,
        type: 'error',
        message: error
      });
    });
    
    validation.warnings.forEach(warning => {
      issues.push({
        slug: blog.slug,
        title: blog.title,
        type: 'warning',
        message: warning
      });
    });
  });
  
  return { blogStats, demoStats, issues };
}

/**
 * Get suggestions for blog improvements
 */
export function getBlogSuggestions(slug: string): string[] {
  const blog = blogManager.getBlog(slug);
  if (!blog) return ['Blog not found'];
  
  const suggestions: string[] = [];
  
  // Reading time suggestions
  if (blog.reading_time < 5) {
    suggestions.push('Consider expanding the content - very short articles may not provide enough value');
  } else if (blog.reading_time > 30) {
    suggestions.push('Consider breaking this into a series - very long articles can be overwhelming');
  }
  
  // Tag suggestions
  if (blog.tags.length < 3) {
    suggestions.push('Add more tags to improve discoverability');
  } else if (blog.tags.length > 8) {
    suggestions.push('Consider reducing tags - too many can dilute relevance');
  }
  
  // Category suggestions
  if (!blog.category) {
    suggestions.push('Assign a category to help readers find related content');
  }
  
  // Difficulty suggestions
  if (!blog.difficulty) {
    suggestions.push('Set a difficulty level to help readers choose appropriate content');
  }
  
  // Related content suggestions
  const relatedBlogs = blogManager.getRelatedBlogs(blog, 5);
  if (relatedBlogs.length === 0) {
    suggestions.push('Consider adding more tags or adjusting category to improve content relationships');
  }
  
  // Demo usage suggestions
  const demoCount = blog.related_demos?.length || 0;
  if (demoCount === 0) {
    suggestions.push('Consider adding interactive demos to enhance engagement');
  } else if (demoCount > 5) {
    suggestions.push('Too many demos might overwhelm readers - consider focusing on the most important ones');
  }
  
  return suggestions;
}

/**
 * Find orphaned content (unused demos, tags with only one blog, etc.)
 */
export function findOrphanedContent(): {
  unusedDemos: string[];
  singleUseTags: string[];
  categoriesWithOnePost: string[];
} {
  const demoStats = getDemoStats();
  const tags = blogManager.getTags().filter(t => t.count === 1);
  const categories = blogManager.getCategories().filter(c => c.count === 1);
  
  return {
    unusedDemos: demoStats.unusedDemos,
    singleUseTags: tags.map(t => t.tag),
    categoriesWithOnePost: categories.map(c => c.category)
  };
}

/**
 * Generate SEO recommendations
 */
export function getSEORecommendations(slug: string): string[] {
  const blog = blogManager.getBlog(slug);
  if (!blog) return ['Blog not found'];
  
  const recommendations: string[] = [];
  
  // Title length
  if (blog.title.length < 30) {
    recommendations.push('Title is quite short - consider making it more descriptive for SEO');
  } else if (blog.title.length > 60) {
    recommendations.push('Title is too long - search engines may truncate it');
  }
  
  // Excerpt length
  if (blog.excerpt.length < 120) {
    recommendations.push('Excerpt is short - expand it for better search result snippets');
  } else if (blog.excerpt.length > 160) {
    recommendations.push('Excerpt is too long - search engines may truncate it');
  }
  
  // Content length
  if (blog.wordCount && blog.wordCount < 300) {
    recommendations.push('Content is quite short - longer articles tend to rank better');
  }
  
  // Tag usage
  if (blog.tags.length < 3) {
    recommendations.push('Add more relevant tags to improve content categorization');
  }
  
  return recommendations;
}

// Console helpers for development
if (typeof window !== 'undefined') {
  (window as any).blogAdmin = {
    stats: getBlogStats,
    demoStats: getDemoStats,
    validate: validateBlog,
    report: generateContentReport,
    suggestions: getBlogSuggestions,
    orphaned: findOrphanedContent,
    seo: getSEORecommendations
  };
  
  console.log('📝 Blog admin utilities available at window.blogAdmin');
  console.log('Try: blogAdmin.stats(), blogAdmin.report(), etc.');
}
