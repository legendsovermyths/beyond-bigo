import { ComponentType, lazy } from 'react';

export interface DemoComponentProps {
  [key: string]: any;
}

export interface DemoDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  component: ComponentType<DemoComponentProps>;
  defaultProps?: DemoComponentProps;
}

// Demo category definitions
export const DEMO_CATEGORIES = {
  'pattern-matching': 'Pattern Matching',
  'data-structures': 'Data Structures',
  'signal-processing': 'Signal Processing',
  'string-algorithms': 'String Algorithms',
  'graph-algorithms': 'Graph Algorithms',
  'math': 'Mathematics',
  'visualization': 'Visualization'
} as const;

type DemoCategory = keyof typeof DEMO_CATEGORIES;

class DemoRegistry {
  private demos = new Map<string, DemoDefinition>();
  private categoryMap = new Map<string, Set<string>>();

  /**
   * Register a new demo component
   */
  register(demo: DemoDefinition): void {
    this.demos.set(demo.id, demo);
    
    // Add to category map
    if (!this.categoryMap.has(demo.category)) {
      this.categoryMap.set(demo.category, new Set());
    }
    this.categoryMap.get(demo.category)!.add(demo.id);
  }

  /**
   * Get a demo by ID
   */
  get(id: string): DemoDefinition | undefined {
    return this.demos.get(id);
  }

  /**
   * Get all demos in a category
   */
  getByCategory(category: string): DemoDefinition[] {
    const demoIds = this.categoryMap.get(category) || new Set();
    return Array.from(demoIds)
      .map(id => this.demos.get(id))
      .filter((demo): demo is DemoDefinition => demo !== undefined);
  }

  /**
   * Get all registered demos
   */
  getAll(): DemoDefinition[] {
    return Array.from(this.demos.values());
  }

  /**
   * Get all categories with demo counts
   */
  getCategories(): { category: string; name: string; count: number }[] {
    return Object.entries(DEMO_CATEGORIES).map(([category, name]) => ({
      category,
      name,
      count: this.categoryMap.get(category)?.size || 0
    }));
  }

  /**
   * Check if a demo exists
   */
  has(id: string): boolean {
    return this.demos.has(id);
  }

  /**
   * Unregister a demo
   */
  unregister(id: string): boolean {
    const demo = this.demos.get(id);
    if (!demo) return false;

    this.demos.delete(id);
    this.categoryMap.get(demo.category)?.delete(id);
    return true;
  }
}

// Create singleton instance
export const demoRegistry = new DemoRegistry();

// Lazy load demo components to avoid bundling all demos
const SlideMultiplyDemo = lazy(() => import('@/components/demos/SlideMultiplyDemo'));
const TrieDemo = lazy(() => import('@/components/demos/TrieDemo'));
const AhoCorasickDemo = lazy(() => import('@/components/demos/AhoCorasickDemo'));
const SignalDemo = lazy(() => import('@/components/demos/SignalDemo'));
const FFTDemo = lazy(() => import('@/components/demos/FFTDemo'));

// Register existing demos
demoRegistry.register({
  id: 'slide-multiply',
  name: 'Sliding Window Pattern Matching',
  description: 'Interactive visualization of sliding window pattern matching with character encoding',
  category: 'pattern-matching',
  component: SlideMultiplyDemo,
  defaultProps: {
    defaultText: "ATCGATCG",
    defaultPattern: "TCG"
  }
});

demoRegistry.register({
  id: 'trie',
  name: 'Trie Data Structure',
  description: 'Interactive trie visualization for string storage and searching',
  category: 'data-structures',
  component: TrieDemo,
  defaultProps: {
    defaultSequences: ["ATCG", "ATCGA", "ATCGAT"]
  }
});

demoRegistry.register({
  id: 'aho-corasick',
  name: 'Aho-Corasick Automaton',
  description: 'Multi-pattern string matching with failure links visualization',
  category: 'string-algorithms',
  component: AhoCorasickDemo,
  defaultProps: {
    defaultText: "ATCGATCG",
    defaultPatterns: [["TCG", "ATCG"], ["GAT", "CGAT"], ["ATC", "TCGA", "CGAT"]]
  }
});

demoRegistry.register({
  id: 'signal',
  name: 'Signal Processing Visualization',
  description: 'Convert DNA sequences to binary signals for pattern matching',
  category: 'signal-processing',
  component: SignalDemo,
  defaultProps: {
    defaultSequence: "AGGCGTA"
  }
});

demoRegistry.register({
  id: 'fft',
  name: 'FFT Pattern Matching',
  description: 'Complete FFT-based pattern matching algorithm demonstration',
  category: 'signal-processing',
  component: FFTDemo,
  defaultProps: {
    defaultText: "ATCGATCGATCG",
    defaultPattern: "TCGA"
  }
});

export default demoRegistry;
