import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TrieDemoProps {
  defaultSequences?: string[];
}

interface TrieNode {
  id: string;
  char: string;
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  x: number;
  y: number;
  level: number;
  highlighted: boolean;
  searchHighlight: boolean;
}

interface SearchAnimation {
  active: boolean;
  path: TrieNode[];
  currentIndex: number;
  found: boolean;
  isPrefix: boolean;
}

interface TrieStats {
  wordCount: number;
  nodeCount: number;
  memorySaving: number;
}

class Trie {
  root: TrieNode;
  wordCount: number;

  constructor() {
    this.root = {
      id: 'root',
      char: '',
      children: new Map(),
      isEndOfWord: false,
      x: 0,
      y: 0,
      level: 0,
      highlighted: false,
      searchHighlight: false
    };
    this.wordCount = 0;
  }

  insert(word: string): boolean {
    let node = this.root;
    word = word.toUpperCase().trim();
    
    if (!word || !/^[ATGC]+$/.test(word)) return false;
    
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, {
          id: `${node.id}-${char}`,
          char,
          children: new Map(),
          isEndOfWord: false,
          x: 0,
          y: 0,
          level: node.level + 1,
          highlighted: false,
          searchHighlight: false
        });
      }
      node = node.children.get(char)!;
    }
    
    if (!node.isEndOfWord) {
      node.isEndOfWord = true;
      this.wordCount++;
      return true;
    }
    return false;
  }

  search(word: string): { found: boolean; isPrefix: boolean; path: TrieNode[] } {
    let node = this.root;
    word = word.toUpperCase().trim();
    const path = [this.root];
    
    for (const char of word) {
      if (!node.children.has(char)) {
        return { found: false, isPrefix: false, path };
      }
      node = node.children.get(char)!;
      path.push(node);
    }
    
    return { 
      found: node.isEndOfWord, 
      isPrefix: !node.isEndOfWord && node.children.size > 0,
      path 
    };
  }

  getAllNodes(): TrieNode[] {
    const nodes: TrieNode[] = [];
    
    const traverse = (node: TrieNode) => {
      nodes.push(node);
      for (const child of node.children.values()) {
        traverse(child);
      }
    };
    
    traverse(this.root);
    return nodes;
  }

  clearHighlights() {
    const nodes = this.getAllNodes();
    nodes.forEach(node => {
      node.highlighted = false;
      node.searchHighlight = false;
    });
  }

  clear() {
    this.root = {
      id: 'root',
      char: '',
      children: new Map(),
      isEndOfWord: false,
      x: 0,
      y: 0,
      level: 0,
      highlighted: false,
      searchHighlight: false
    };
    this.wordCount = 0;
  }
}

export default function TrieDemo({ defaultSequences = ['ATCG', 'ATCGA', 'ATCGAT'] }: TrieDemoProps) {
  const [trie] = useState(() => new Trie());
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState<string>('');
  const [searchAnimation, setSearchAnimation] = useState<SearchAnimation>({
    active: false,
    path: [],
    currentIndex: 0,
    found: false,
    isPrefix: false
  });
  const [stats, setStats] = useState<TrieStats>({ wordCount: 0, nodeCount: 0, memorySaving: 0 });
  const [forceUpdate, setForceUpdate] = useState(0);
  const animationRef = useRef<NodeJS.Timeout>();

  // Initialize with default sequences
  useEffect(() => {
    defaultSequences.forEach(seq => trie.insert(seq));
    updateStats();
    setForceUpdate(prev => prev + 1);
  }, []);

  const calculatePositions = () => {
    const nodes = trie.getAllNodes();
    const levelGroups: TrieNode[][] = [];
    
    // Group nodes by level
    nodes.forEach(node => {
      if (!levelGroups[node.level]) levelGroups[node.level] = [];
      levelGroups[node.level].push(node);
    });

    const svgWidth = Math.max(800, levelGroups.reduce((max, level) => Math.max(max, level.length * 120), 0));
    const svgHeight = Math.max(400, levelGroups.length * 80);
    
    // Position nodes
    levelGroups.forEach((levelNodes, level) => {
      const levelY = 50 + level * 80;
      const totalWidth = levelNodes.length * 120;
      const startX = Math.max(60, (svgWidth - totalWidth) / 2);
      
      levelNodes.forEach((node, index) => {
        node.x = startX + index * 120;
        node.y = levelY;
      });
    });

    return { svgWidth, svgHeight };
  };

  const updateStats = () => {
    const nodes = trie.getAllNodes();
    const nodeCount = nodes.length - 1; // Exclude root
    const naiveStorage = trie.wordCount * 6; // Assume avg 6 chars per DNA sequence
    const memorySaving = naiveStorage > 0 ? Math.max(0, Math.round((1 - nodeCount / naiveStorage) * 100)) : 0;
    
    setStats({
      wordCount: trie.wordCount,
      nodeCount,
      memorySaving
    });
  };

  const handleAddSequence = () => {
    if (!inputValue.trim()) return;
    
    if (trie.insert(inputValue)) {
      setInputValue('');
      updateStats();
      setForceUpdate(prev => prev + 1);
    } else {
      alert('Invalid sequence (use only A, T, G, C) or sequence already exists!');
    }
  };

  const animateSearch = (path: TrieNode[], found: boolean, isPrefix: boolean) => {
    trie.clearHighlights();
    setSearchAnimation({
      active: true,
      path,
      currentIndex: 0,
      found,
      isPrefix
    });

    let currentIndex = 0;
    const animate = () => {
      if (currentIndex < path.length) {
        path[currentIndex].searchHighlight = true;
        currentIndex++;
        setForceUpdate(prev => prev + 1);
        animationRef.current = setTimeout(animate, 500);
      } else {
        setSearchAnimation(prev => ({ ...prev, active: false }));
        
        // Show final result
        if (found) {
          setSearchResult(`"${searchValue}" found!`);
        } else if (isPrefix) {
          setSearchResult(`"${searchValue}" is a prefix but not a complete sequence`);
        } else {
          setSearchResult(`"${searchValue}" not found`);
        }
      }
    };
    
    animate();
  };

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    
    const result = trie.search(searchValue);
    animateSearch(result.path, result.found, result.isPrefix);
  };

  const handleClear = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    
    trie.clear();
    trie.clearHighlights();
    updateStats();
    setSearchResult('');
    setSearchValue('');
    setInputValue('');
    setSearchAnimation({ active: false, path: [], currentIndex: 0, found: false, isPrefix: false });
    setForceUpdate(prev => prev + 1);
  };

  const handlePreset = (sequences: string[]) => {
    sequences.forEach(seq => trie.insert(seq));
    updateStats();
    setForceUpdate(prev => prev + 1);
  };

  const { svgWidth, svgHeight } = calculatePositions();
  const nodes = trie.getAllNodes();
  const edges: { from: TrieNode; to: TrieNode }[] = [];
  
  // Build edges
  nodes.forEach(node => {
    node.children.forEach(child => {
      edges.push({ from: node, to: child });
    });
  });

  return (
    <div className="trie-demo">
      {/* Controls */}
      <div className="controls">
        <div className="input-section">
          <Label htmlFor="trie-sequence-input">Add Sequence:</Label>
          <Input
            id="trie-sequence-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase().replace(/[^ATGC]/g, ''))}
            placeholder="Type DNA sequence (A, T, G, C)"
            maxLength={20}
            className="sequence-input"
          />
          <Button onClick={handleAddSequence} size="sm">
            Add Sequence
          </Button>
        </div>
        
        <div className="search-section">
          <Label htmlFor="trie-search-input">Search:</Label>
          <Input
            id="trie-search-input"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value.toUpperCase().replace(/[^ATGC]/g, ''))}
            placeholder="Search for sequence"
            maxLength={20}
            className="search-input"
          />
          <Button onClick={handleSearch} size="sm" variant="secondary">
            Search
          </Button>
          <span className={`search-result ${
            searchResult.includes('found!') ? 'success' : 
            searchResult.includes('prefix') ? 'warning' : 
            searchResult.includes('not found') ? 'error' : ''
          }`}>
            {searchResult}
          </span>
        </div>
        
        <div className="preset-section">
          <Button 
            onClick={() => handlePreset(['ATCG', 'ATCGA', 'ATCGAT'])}
            size="sm" 
            variant="outline"
            className="preset-btn"
          >
            Add: ATCG, ATCGA, ATCGAT
          </Button>
          <Button 
            onClick={() => handlePreset(['GGCC', 'GGCCT', 'GGCCTA'])}
            size="sm" 
            variant="outline"
            className="preset-btn"
          >
            Add: GGCC, GGCCT, GGCCTA
          </Button>
          <Button 
            onClick={() => handlePreset(['TACG', 'TACGA', 'TACGAC'])}
            size="sm" 
            variant="outline"
            className="preset-btn"
          >
            Add: TACG, TACGA, TACGAC
          </Button>
          <Button onClick={handleClear} size="sm" variant="destructive">
            Clear All
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-circle default"></div>
          <span>Regular Node</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle end-word"></div>
          <span>End of Sequence</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle search-highlight"></div>
          <span>Search Path</span>
        </div>
      </div>

      {/* Visualization */}
      <div className="visualization-container">
        <svg 
          width={svgWidth} 
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="trie-svg"
        >
          {/* Edges */}
          {edges.map((edge, index) => (
            <line
              key={index}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              className="edge"
            />
          ))}
          
          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={20}
                className={`node ${node.isEndOfWord ? 'end-word' : ''} ${
                  node.searchHighlight ? 'search-highlight' : ''
                } ${node.highlighted ? 'highlighted' : ''}`}
              />
              {node.char && (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="node-text"
                >
                  {node.char}
                </text>
              )}
              {node.char === '' && (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="root-text"
                >
                  ROOT
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Statistics */}
      <div className="stats">
        <span><strong>DNA sequences stored:</strong> {stats.wordCount}</span>
        <span><strong>Nodes created:</strong> {stats.nodeCount}</span>
        <span><strong>Memory saved:</strong> {stats.memorySaving}%</span>
      </div>

      <style>{`
        .trie-demo {
          margin: 1.5rem 0;
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: flex-start;
          background: hsl(var(--muted) / 0.3);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .input-section, .search-section {
          display: flex;
          flex-direction: row;
          gap: 0.75rem;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
        }

        .preset-section {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
        }

        .sequence-input, .search-input {
          min-width: 200px;
          flex: 1;
          max-width: 300px;
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--background)) !important;
        }

        .search-result {
          font-weight: 500;
          font-size: 0.875rem;
          min-width: 200px;
        }

        .search-result.success {
          color: #22c55e;
        }

        .search-result.warning {
          color: #f59e0b;
        }

        .search-result.error {
          color: #ef4444;
        }

        .preset-btn {
          font-size: 0.75rem;
          padding: 0.5rem 0.75rem;
          white-space: nowrap;
        }

        .legend {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background: hsl(var(--muted) / 0.2);
          border-radius: 6px;
          flex-wrap: wrap;
          border: 1px solid hsl(var(--border) / 0.2);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: hsl(var(--muted-foreground));
        }

        .legend-circle {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid;
          flex-shrink: 0;
        }

        .legend-circle.default {
          background: hsl(var(--background));
          border-color: hsl(var(--border));
        }

        .legend-circle.end-word {
          background: #3b82f6;
          border-color: #2563eb;
        }

        .legend-circle.search-highlight {
          background: #22c55e;
          border-color: #16a34a;
        }

        .visualization-container {
          background: hsl(var(--background) / 0.5);
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.4);
          padding: 1rem;
          margin-bottom: 1rem;
          overflow: auto;
          min-height: 400px;
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
        }

        .trie-svg {
          max-width: 100%;
          height: auto;
        }

        .edge {
          stroke: hsl(var(--muted-foreground));
          stroke-width: 2;
          opacity: 0.6;
        }

        .node {
          fill: hsl(var(--background));
          stroke: hsl(var(--border));
          stroke-width: 2;
          transition: all 0.3s ease;
        }

        .node.end-word {
          fill: #3b82f6;
          stroke: #2563eb;
        }

        .node.search-highlight {
          fill: #22c55e;
          stroke: #16a34a;
          stroke-width: 3;
        }

        .node.highlighted {
          fill: #f59e0b;
          stroke: #d97706;
          stroke-width: 3;
        }

        .node-text, .root-text {
          fill: hsl(var(--foreground));
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          font-size: 14px;
          pointer-events: none;
        }

        .node.end-word .node-text,
        .node.search-highlight .node-text,
        .node.highlighted .node-text {
          fill: white;
        }

        .root-text {
          font-size: 10px;
          font-weight: 700;
        }

        .stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          padding: 0.75rem 1rem;
          background: hsl(var(--muted) / 0.3);
          border-radius: 6px;
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
          border: 1px solid hsl(var(--border) / 0.3);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .trie-demo {
            padding: 0;
            margin: 1rem 0;
          }

          .controls {
            padding: 1rem;
          }

          .input-section, .search-section {
            flex-direction: row;
            align-items: center;
          }

          .preset-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .sequence-input, .search-input {
            min-width: 200px;
            flex: 1;
            color: hsl(var(--foreground)) !important;
            background: hsl(var(--background)) !important;
          }

          .preset-btn {
            flex: 1;
            min-width: 120px;
            font-size: 0.7rem;
            padding: 0.4rem 0.5rem;
          }

          .legend {
            gap: 1rem;
            padding: 0.75rem;
          }

          .legend-item {
            font-size: 0.75rem;
          }

          .legend-circle {
            width: 14px;
            height: 14px;
          }

          .stats {
            flex-direction: column;
            gap: 0.5rem;
            text-align: left;
          }

          .visualization-container {
            padding: 0.5rem;
            min-height: 300px;
          }

          .trie-svg {
            width: 100%;
            min-width: 300px;
          }
        }

        @media (max-width: 480px) {
          .trie-demo {
            padding: 0;
          }

          .controls {
            padding: 0.75rem;
          }

          .preset-btn {
            font-size: 0.65rem;
            padding: 0.3rem 0.4rem;
            min-width: 100px;
          }

          .legend {
            gap: 0.75rem;
            padding: 0.5rem;
            flex-direction: column;
          }

          .legend-item {
            font-size: 0.7rem;
          }

          .legend-circle {
            width: 12px;
            height: 12px;
          }

          .node {
            r: 18;
          }

          .node-text, .root-text {
            font-size: 12px;
          }

          .root-text {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
}
