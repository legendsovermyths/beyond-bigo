# 🚀 Beyond Big-O Chronicles

> **Algorithms beyond interview preparation** - A modern, interactive blog exploring advanced pattern matching, bioinformatics, computational theory, and algorithmic thinking.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/beyond-bigo-chronicles.git
cd beyond-bigo-chronicles

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) to view the application.

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
beyond-bigo-chronicles/
├── src/
│   ├── components/           # React components
│   │   ├── demos/           # Interactive demo components
│   │   ├── ui/              # Reusable UI components
│   │   └── ...
│   ├── data/                # Blog posts and content
│   │   ├── blogLoader.ts    # Automatic blog loading
│   │   └── *.md            # Markdown blog files
│   ├── lib/                 # Core utilities
│   │   ├── blogManager.ts   # Blog management system
│   │   ├── demoRegistry.ts  # Demo component registry
│   │   └── seo.ts          # SEO utilities
│   ├── pages/               # Route components
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── public/                  # Static assets
├── docs/                   # Documentation
│   ├── BLOG_SYSTEM.md      # Blog system documentation
│   └── SEO_IMPROVEMENTS.md # SEO guide
└── ...
```

## Adding Content

### Creating a New Blog Post

1. **Create a markdown file** in `src/data/`:

```markdown
---
layout: post
title: "Your Amazing Algorithm Post"
date: 2025-01-21
author: "Your Name"
excerpt: "A compelling description of your post"
tags: ["algorithms", "interactive"]
category: "algorithms"
reading_time: 15
featured: false
published: true
difficulty: "intermediate"
related_demos: ["demo-id"]
---

# Your Content Here

Write your blog post using standard Markdown syntax.

## Add Interactive Demos

:::demo-your-demo
prop1: "value1"
prop2: 42
:::

More content...
```

2. **Register the blog** in `src/data/blogLoader.ts`:

```typescript
import yourBlogContent from './your-blog.md?raw';

const BLOG_SOURCES = [
  // ... existing blogs
  {
    slug: 'your-blog-slug',
    content: yourBlogContent,
    lastModified: '2025-01-21'
  }
];
```

3. **That's it!** The system automatically handles everything else.

### Creating Interactive Demos

1. **Create your demo component**:

```typescript
// src/components/demos/YourDemo.tsx
interface YourDemoProps {
  prop1?: string;
  prop2?: number;
}

export default function YourDemo({ prop1 = "default", prop2 = 0 }: YourDemoProps) {
  return (
    <div className="demo-container">
      {/* Your interactive demo */}
    </div>
  );
}
```

2. **Register in the demo registry**:

```typescript
// src/lib/demoRegistry.ts
import YourDemo from '@/components/demos/YourDemo';

demoRegistry.register({
  id: 'your-demo',
  name: 'Your Demo Name',
  description: 'What your demo demonstrates',
  category: 'algorithms',
  component: lazy(() => import('@/components/demos/YourDemo')),
  defaultProps: { prop1: "example" }
});
```

3. **Use in blog posts**:

```markdown
:::demo-your-demo
prop1: "custom value"
prop2: 100
:::
```

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development experience
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Beautiful, accessible component library

### Content Management
- **Markdown** - Simple, readable content format
- **ReactMarkdown** - Markdown rendering with React components
- **KaTeX** - Mathematical notation rendering
- **Rehype/Remark** - Markdown processing pipeline

### Features
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon library
- **React Query** - Server state management
- **Next Themes** - Theme switching support


### Performance Optimizations
- ✅ Lazy loading for demo components
- ✅ Code splitting with dynamic imports
- ✅ Efficient blog indexing with Maps
- ✅ Responsive image loading
- ✅ Optimized bundle size

## 🛠️ Development Tools

### Admin Utilities

Open browser console and use:

```javascript
// Get blog statistics
blogAdmin.stats()

// Validate blog content
blogAdmin.validate(content, slug)

// Generate content report
blogAdmin.report()

// Get SEO recommendations
blogAdmin.seo('blog-slug')

// Find orphaned content
blogAdmin.orphaned()
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 📊 Blog Management Features

### Content Organization
- **Categories**: Organize posts by topic (algorithms, data-structures, etc.)
- **Tags**: Multi-dimensional content classification
- **Difficulty Levels**: Beginner, intermediate, advanced
- **Featured Posts**: Highlight important content

### Search & Discovery
- **Real-time Search** across all content
- **Advanced Filtering** by category, tags, author, difficulty
- **Related Content** suggestions based on content similarity
- **Recent Posts** and featured content sections

### Content Quality
- **Reading Time Estimation** based on word count
- **Content Validation** with error checking
- **SEO Recommendations** for better discoverability
- **Quality Metrics** and content analytics

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
---

<div align="center">

**Built with ❤️ for the algorithms community**

[Live Demo](https://your-domain.com) • [Documentation](BLOG_SYSTEM.md) • [Contributing](CONTRIBUTING.md)

</div>
