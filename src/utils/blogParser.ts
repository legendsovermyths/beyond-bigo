import { BlogPost, BlogFrontmatter } from '@/types/blog';

// Simple frontmatter parser that works in the browser
function parseFrontmatter(content: string) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content };
  }
  
  const [, frontmatterText, markdownContent] = match;
  const data: any = {};
  
  // Parse YAML-like frontmatter
  const lines = frontmatterText.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    
    if (value.startsWith('[') && value.endsWith(']')) {
      // Parse array
      const arrayContent = value.slice(1, -1);
      data[key] = arrayContent.split(',').map(item => item.trim().replace(/"/g, ''));
    } else if (value.startsWith('"') && value.endsWith('"')) {
      // Parse string
      data[key] = value.slice(1, -1);
    } else if (!isNaN(Number(value))) {
      // Parse number
      data[key] = Number(value);
    } else {
      // Default to string
      data[key] = value.replace(/"/g, '');
    }
  }
  
  return { data, content: markdownContent };
}

export function parseBlogPost(content: string, slug: string): BlogPost {
  const { data, content: markdownContent } = parseFrontmatter(content);
  
  return {
    slug,
    layout: data.layout || 'post',
    title: data.title || '',
    date: data.date || '',
    author: data.author || '',
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    category: data.category,
    reading_time: data.reading_time || 5,
    content: markdownContent,
    featured: data.featured || false,
    published: data.published !== false, // Default to published unless explicitly false
    lastModified: data.lastModified,
    difficulty: data.difficulty,
    related_demos: data.related_demos || [],
  };
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min read`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m read`;
}