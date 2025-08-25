export interface BlogPost {
  slug: string;
  layout: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  category?: string;
  reading_time: number;
  content: string;
  featured?: boolean;
  published?: boolean;
  lastModified?: string;
  wordCount?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  related_demos?: string[]; // Demo IDs used in this post
}

export interface BlogFrontmatter {
  layout: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  category?: string;
  reading_time: number;
  featured?: boolean;
  published?: boolean;
  lastModified?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  related_demos?: string[];
}

export interface BlogFilter {
  tags?: string[];
  category?: string;
  author?: string;
  difficulty?: string;
  featured?: boolean;
  published?: boolean;
}

export interface BlogSortOptions {
  field: 'date' | 'title' | 'reading_time' | 'lastModified';
  direction: 'asc' | 'desc';
}