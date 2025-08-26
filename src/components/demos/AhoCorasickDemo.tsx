import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface AhoCorasickDemoProps {
  defaultText?: string;
  defaultPatterns?: string[][];
}

interface ACNode {
  id: string;
  char: string;
  children: Map<string, ACNode>;
  isEndOfWord: boolean;
  pattern?: string;
  failureLink: ACNode | null;
  outputLinks: ACNode[];
  depth: number;
  x: number;
  y: number;
  highlighted: boolean;
  currentMatch: boolean;
}

interface Match {
  pattern: string;
  position: number;
  endPosition: number;
}

interface AnimationState {
  isAnimating: boolean;
  currentChar: string;
  previousState: ACNode | null;
  usedFailureLink: boolean;
  newMatches: Match[];
}

class AhoCorasick {
  root: ACNode;
  patterns: string[];
  currentState: ACNode;
  matches: Match[];
  animationState: AnimationState;

  constructor() {
    this.root = {
      id: 'root',
      char: '',
      children: new Map(),
      isEndOfWord: false,
      failureLink: null,
      outputLinks: [],
      depth: 0,
      x: 0,
      y: 0,
      highlighted: false,
      currentMatch: false
    };
    this.patterns = [];
    this.currentState = this.root;
    this.matches = [];
    this.animationState = {
      isAnimating: false,
      currentChar: '',
      previousState: null,
      usedFailureLink: false,
      newMatches: []
    };
  }

  addPattern(pattern: string): boolean {
    const normalizedPattern = pattern.toUpperCase().trim();
    if (!normalizedPattern || !/^[ATGC]+$/.test(normalizedPattern)) return false;
    if (this.patterns.includes(normalizedPattern)) return false;

    this.patterns.push(normalizedPattern);
    let node = this.root;
    
    for (const char of normalizedPattern.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, {
          id: `${node.id}-${char}`,
          char,
          children: new Map(),
          isEndOfWord: false,
          pattern: undefined,
          failureLink: null,
          outputLinks: [],
          depth: node.depth + 1,
          x: 0,
          y: 0,
          highlighted: false,
          currentMatch: false
        });
      }
      node = node.children.get(char)!;
    }
    
    node.isEndOfWord = true;
    node.pattern = normalizedPattern;
    return true;
  }

  buildFailureLinks() {
    const queue: ACNode[] = [];
    
    // All first level nodes have failure link to root
    for (const child of this.root.children.values()) {
      child.failureLink = this.root;
      queue.push(child);
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      for (const [char, child] of current.children.entries()) {
        queue.push(child);
        
        // Find failure link
        let failureState = current.failureLink;
        
        while (failureState !== null && !failureState.children.has(char)) {
          failureState = failureState.failureLink;
        }
        
        if (failureState === null) {
          child.failureLink = this.root;
        } else {
          child.failureLink = failureState.children.get(char)!;
        }
        
        // Build output links
        child.outputLinks = [];
        let outputState = child.failureLink;
        while (outputState !== null) {
          if (outputState.isEndOfWord) {
            child.outputLinks.push(outputState);
          }
          outputState = outputState.failureLink;
        }
      }
    }
  }

  search(text: string): Match[] {
    this.matches = [];
    this.currentState = this.root;
    
    for (let i = 0; i < text.length; i++) {
      this.processCharacter(text[i].toLowerCase(), i);
    }
    
    return this.matches;
  }

  processCharacter(char: string, position: number) {
    char = char.toLowerCase();
    
    this.animationState.currentChar = char;
    this.animationState.previousState = this.currentState;
    this.animationState.usedFailureLink = false;
    this.animationState.newMatches = [];
    
    // Clear previous match highlights
    const nodes = this.getAllNodes();
    nodes.forEach(node => {
      node.currentMatch = false;
    });
    
    // Try to find transition
    while (this.currentState !== null && !this.currentState.children.has(char)) {
      this.currentState = this.currentState.failureLink;
      this.animationState.usedFailureLink = true;
    }
    
    if (this.currentState === null) {
      this.currentState = this.root;
    } else {
      this.currentState = this.currentState.children.get(char)!;
    }
    
    // Clear all highlights first, then highlight current path
    const allNodes = this.getAllNodes();
    allNodes.forEach(node => node.highlighted = false);
    
    // Highlight current path
    this.currentState.highlighted = true;
    
    // Check for matches
    if (this.currentState.isEndOfWord) {
      this.currentState.currentMatch = true;
      const match: Match = {
        pattern: this.currentState.pattern!,
        position: position - this.currentState.pattern!.length + 1,
        endPosition: position
      };
      this.matches.push(match);
      this.animationState.newMatches.push(match);
    }
    
    // Check output links for additional matches
    for (const outputNode of this.currentState.outputLinks) {
      outputNode.currentMatch = true;
      const match: Match = {
        pattern: outputNode.pattern!,
        position: position - outputNode.pattern!.length + 1,
        endPosition: position
      };
      this.matches.push(match);
      this.animationState.newMatches.push(match);
    }
  }

  getAllNodes(): ACNode[] {
    const nodes: ACNode[] = [];
    
    const traverse = (node: ACNode) => {
      nodes.push(node);
      for (const child of node.children.values()) {
        traverse(child);
      }
    };
    
    traverse(this.root);
    return nodes;
  }

  getEdges(): { from: ACNode; to: ACNode; type: 'trie' | 'failure' }[] {
    const edges: { from: ACNode; to: ACNode; type: 'trie' | 'failure' }[] = [];
    const nodes = this.getAllNodes();
    
    nodes.forEach(node => {
      // Trie edges
      node.children.forEach(child => {
        edges.push({ from: node, to: child, type: 'trie' });
      });
      
      // Failure links (not to root)
      if (node.failureLink && node.failureLink !== this.root) {
        edges.push({ from: node, to: node.failureLink, type: 'failure' });
      }
    });
    
    return edges;
  }

  clearHighlights() {
    const nodes = this.getAllNodes();
    nodes.forEach(node => {
      node.highlighted = false;
      node.currentMatch = false;
    });
  }

  clear() {
    this.root = {
      id: 'root',
      char: '',
      children: new Map(),
      isEndOfWord: false,
      failureLink: null,
      outputLinks: [],
      depth: 0,
      x: 0,
      y: 0,
      highlighted: false,
      currentMatch: false
    };
    this.patterns = [];
    this.currentState = this.root;
    this.matches = [];
    this.animationState = {
      isAnimating: false,
      currentChar: '',
      previousState: null,
      usedFailureLink: false,
      newMatches: []
    };
  }
}

export default function AhoCorasickDemo({ 
  defaultText = 'ATCGATCG',
  defaultPatterns = [
    ['TCG', 'ATCG'],
    ['GAT', 'CGAT'],
    ['ATC', 'TCGA', 'CGAT']
  ]
}: AhoCorasickDemoProps) {
  const [ac] = useState(() => new AhoCorasick());
  const [inputText, setInputText] = useState(defaultText);
  const [patternInput, setPatternInput] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [stepMode, setStepMode] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Add patterns to begin');
  const [forceUpdate, setForceUpdate] = useState(0);
  const animationRef = useRef<NodeJS.Timeout>();
  const textInputRef = useRef<HTMLInputElement>(null);
  const patternInputRef = useRef<HTMLInputElement>(null);
  const textCursorPosition = useRef(0);
  const patternCursorPosition = useRef(0);

  const calculatePositions = () => {
    const nodes = ac.getAllNodes();
    const levelGroups: ACNode[][] = [];
    
    // Group nodes by depth
    nodes.forEach(node => {
      if (!levelGroups[node.depth]) levelGroups[node.depth] = [];
      levelGroups[node.depth].push(node);
    });

    const svgWidth = Math.max(900, levelGroups.reduce((max, level) => Math.max(max, level.length * 140), 0));
    const svgHeight = Math.max(500, levelGroups.length * 90);
    
    // Position nodes
    levelGroups.forEach((levelNodes, level) => {
      const levelY = 60 + level * 90;
      const totalWidth = svgWidth - 120;
      const startX = Math.max(80, (svgWidth - totalWidth) / 2);
      
      if (levelNodes.length === 1) {
        levelNodes[0].x = svgWidth / 2;
        levelNodes[0].y = levelY;
      } else {
        const spacing = totalWidth / (levelNodes.length + 1);
        levelNodes.forEach((node, index) => {
          node.x = startX + spacing * (index + 1);
          node.y = levelY;
        });
      }
    });

    return { svgWidth, svgHeight };
  };

  const handleAddPattern = () => {
    if (!patternInput.trim()) return;
    
    if (ac.addPattern(patternInput)) {
      ac.buildFailureLinks();
      setPatternInput('');
      setStatusMessage(`Added pattern: ${patternInput.toUpperCase()}`);
      setForceUpdate(prev => prev + 1);
    } else {
      alert('Invalid pattern (use only A, T, G, C) or pattern already exists!');
    }
  };

  const handleSearch = () => {
    if (ac.patterns.length === 0) {
      alert('Please add some patterns first!');
      return;
    }
    
    setStepMode(false);
    ac.clearHighlights();
    const foundMatches = ac.search(inputText);
    setMatches(foundMatches);
    setStatusMessage(
      foundMatches.length === 0 
        ? 'No matches found' 
        : `Found ${foundMatches.length} match${foundMatches.length > 1 ? 'es' : ''}: ${foundMatches.map(m => `"${m.pattern}"`).join(', ')}`
    );
    setForceUpdate(prev => prev + 1);
  };

  const handleStepMode = () => {
    if (ac.patterns.length === 0) {
      alert('Please add some patterns first!');
      return;
    }
    
    if (!stepMode) {
      // Start step mode
      setStepMode(true);
      setCurrentPosition(0);
      setMatches([]);
      ac.currentState = ac.root;
      ac.matches = [];
      ac.clearHighlights();
      setStatusMessage('Step mode: Click "Step Forward" to process character by character');
      setForceUpdate(prev => prev + 1);
    } else {
      // Step forward
      if (currentPosition >= inputText.length) {
        setStepMode(false);
        setStatusMessage(`Step mode complete. Found ${ac.matches.length} matches.`);
        return;
      }
      
      const char = inputText[currentPosition];
      ac.processCharacter(char.toLowerCase(), currentPosition);
      
      let statusMsg = `Step ${currentPosition + 1}: Processing '${char}'`;
      if (ac.animationState.usedFailureLink) {
        statusMsg += ' (used failure link)';
      }
      if (ac.animationState.newMatches.length > 0) {
        statusMsg += ` → Found: ${ac.animationState.newMatches.map(m => m.pattern).join(', ')}`;
      }
      setStatusMessage(statusMsg);
      
      setCurrentPosition(prev => prev + 1);
      setMatches([...ac.matches]);
      setForceUpdate(prev => prev + 1);
    }
  };

  const handleReset = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    
    setStepMode(false);
    setCurrentPosition(0);
    setMatches([]);
    ac.currentState = ac.root;
    ac.matches = [];
    ac.clearHighlights();
    setStatusMessage(ac.patterns.length > 0 ? 'Ready for search' : 'Add patterns to begin');
    setForceUpdate(prev => prev + 1);
  };

  const handleClear = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    
    ac.clear();
    setMatches([]);
    setStepMode(false);
    setCurrentPosition(0);
    setStatusMessage('Add patterns to begin');
    setForceUpdate(prev => prev + 1);
  };

  const handlePresetPatterns = (patterns: string[]) => {
    patterns.forEach(pattern => ac.addPattern(pattern));
    ac.buildFailureLinks();
    setStatusMessage(`Loaded patterns: ${patterns.join(', ')}`);
    setForceUpdate(prev => prev + 1);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    textCursorPosition.current = input.selectionStart || 0;
    const newValue = input.value.toUpperCase().replace(/[^ATGC]/g, '');
    setInputText(newValue);
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    patternCursorPosition.current = input.selectionStart || 0;
    const newValue = input.value.toUpperCase().replace(/[^ATGC]/g, '');
    setPatternInput(newValue);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase();
    const validChars = ['a', 't', 'g', 'c', 'backspace', 'delete', 'tab', 'enter', 'escape', 'home', 'end', 'arrowleft', 'arrowright'];
    
    if (!validChars.includes(key)) {
      e.preventDefault();
      return;
    }
  };

  const handlePatternKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase();
    const validChars = ['a', 't', 'g', 'c', 'backspace', 'delete', 'tab', 'enter', 'escape', 'home', 'end', 'arrowleft', 'arrowright'];
    
    if (!validChars.includes(key)) {
      e.preventDefault();
      return;
    }
  };

  // Restore cursor position after re-render
  useEffect(() => {
    if (textInputRef.current) {
      const newPosition = Math.min(textCursorPosition.current, inputText.length);
      textInputRef.current.setSelectionRange(newPosition, newPosition);
    }
  }, [inputText]);

  useEffect(() => {
    if (patternInputRef.current) {
      const newPosition = Math.min(patternCursorPosition.current, patternInput.length);
      patternInputRef.current.setSelectionRange(newPosition, newPosition);
    }
  }, [patternInput]);

  const renderTextVisualization = () => {
    if (!inputText) return null;
    
    return (
      <div className="text-visualization">
        {inputText.split('').map((char, index) => {
          const inMatch = matches.some(m => index >= m.position && index <= m.endPosition);
          const isCurrentPosition = stepMode && index === currentPosition;
          
          return (
            <span
              key={index}
              className={`text-char ${inMatch ? 'matched' : ''} ${isCurrentPosition ? 'current' : ''}`}
            >
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  const { svgWidth, svgHeight } = calculatePositions();
  const nodes = ac.getAllNodes();
  const edges = ac.getEdges();

  return (
    <div className="aho-corasick-demo">
      {/* Controls */}
      <div className="controls">
        <div className="input-section">
          <Label htmlFor="ac-text-input">Search Text:</Label>
          <Input
            ref={textInputRef}
            id="ac-text-input"
            type="text"
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyDown}
            placeholder="Type DNA sequence to search through"
            maxLength={50}
            className="text-input"
          />
        </div>
        
        <div className="pattern-section">
          <Label htmlFor="pattern-input">Add Pattern:</Label>
          <Input
            ref={patternInputRef}
            id="pattern-input"
            type="text"
            value={patternInput}
            onChange={handlePatternChange}
            onKeyDown={handlePatternKeyDown}
            placeholder="Type DNA pattern (A, T, G, C)"
            maxLength={20}
            className="pattern-input"
          />
          <Button onClick={handleAddPattern} size="sm">
            Add Pattern
          </Button>
        </div>
        
        <div className="action-section">
          <Button onClick={handleSearch} size="sm">
            Search
          </Button>
          <Button onClick={handleStepMode} size="sm" variant="secondary">
            {stepMode ? 'Step Forward' : 'Step Through'}
          </Button>
          <Button onClick={handleReset} size="sm" variant="outline">
            Reset
          </Button>
          <Button onClick={handleClear} size="sm" variant="destructive">
            Clear All
          </Button>
        </div>
        
        <div className="preset-section">
          <Label>Quick Add:</Label>
          {defaultPatterns.map((patternSet, index) => (
            <Button
              key={index}
              onClick={() => handlePresetPatterns(patternSet)}
              size="sm"
              variant="outline"
              className="preset-btn"
            >
              {patternSet.join(', ')}
            </Button>
          ))}
        </div>
        
        <div className="status-section">
          <span className="status-message">{statusMessage}</span>
          {ac.patterns.length > 0 && (
            <span className="patterns-info">
              Patterns loaded: {ac.patterns.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div className="legend-circle default"></div>
          <span>State</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle end-word"></div>
          <span>Accept State</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle current-path"></div>
          <span>Current Path</span>
        </div>
        <div className="legend-item">
          <div className="legend-circle match-found"></div>
          <span>Match Found</span>
        </div>
        <div className="legend-item">
          <div className="legend-line failure"></div>
          <span>Failure Link</span>
        </div>
      </div>

      {/* Visualization */}
      <div className="visualization-container">
        <svg 
          width={svgWidth} 
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="ac-svg"
        >
          {/* Failure links (dashed red lines) */}
          {edges.filter(edge => edge.type === 'failure').map((edge, index) => (
            <line
              key={`failure-${index}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              className="failure-edge"
            />
          ))}
          
          {/* Trie edges */}
          {edges.filter(edge => edge.type === 'trie').map((edge, index) => (
            <line
              key={`trie-${index}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              className="trie-edge"
            />
          ))}
          
          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node === ac.root ? 22 : 20}
                className={`node ${node.isEndOfWord ? 'end-word' : ''} ${
                  node.currentMatch ? 'match-found' : ''
                } ${node.highlighted ? 'current-path' : ''}`}
              />
              {node.char && (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="node-text"
                >
                  {node.char.toUpperCase()}
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
              {node.isEndOfWord && node !== ac.root && (
                <circle
                  cx={node.x + 14}
                  cy={node.y - 14}
                  r={4}
                  className="end-marker"
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Text Visualization */}
      {inputText && (
        <div className="text-display">
          <Label>Text Analysis:</Label>
          {renderTextVisualization()}
        </div>
      )}

      <style>{`
        .aho-corasick-demo {
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

        .input-section, .pattern-section, .action-section, .preset-section, .status-section {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
        }

        .text-input, .pattern-input {
          min-width: 250px;
          flex: 1;
          max-width: 400px;
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--background)) !important;
        }

        .preset-btn {
          font-size: 0.75rem;
          padding: 0.5rem 0.75rem;
          white-space: nowrap;
        }

        .status-section {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .status-message {
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .patterns-info {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
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
          position: relative;
        }

        .legend-circle.end-word::after {
          
        }

        .legend-circle.current-path {
          background: #d1fae5;
          border-color: #16a34a;
        }

        .legend-circle.match-found {
          background: #22c55e;
          border-color: #16a34a;
        }

        .legend-line {
          width: 20px;
          height: 2px;
          flex-shrink: 0;
        }

        .legend-line.failure {
          background: #ef4444;
          border: 1px dashed #ef4444;
        }

        .visualization-container {
          background: hsl(var(--background) / 0.5);
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.4);
          padding: 1rem;
          margin: 1rem 0;
          overflow: auto;
          min-height: 400px;
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
        }

        .ac-svg {
          max-width: 100%;
          height: auto;
        }

        .trie-edge {
          stroke: hsl(var(--muted-foreground));
          stroke-width: 2;
          opacity: 0.8;
        }

        .failure-edge {
          stroke: #ef4444;
          stroke-width: 1.5;
          stroke-dasharray: 5,5;
          opacity: 0.7;
        }

        .node {
          fill: hsl(var(--background));
          stroke: hsl(var(--border));
          stroke-width: 2;
          transition: all 0.3s ease;
        }

        .node.end-word {
          stroke: hsl(var(--border));
          stroke-width: 2;
        }

        .node.current-path {
          fill: #d1fae5;
          stroke: #16a34a;
          stroke-width: 3;
        }

        .node.match-found {
          fill: #22c55e;
          stroke: #16a34a;
          stroke-width: 3;
        }

        .node-text, .root-text {
          fill: hsl(var(--foreground));
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          font-size: 14px;
          pointer-events: none;
        }

        .node.current-path .node-text,
        .node.match-found .node-text {
          fill: white;
        }

        .root-text {
          font-size: 10px;
          font-weight: 700;
        }

        .end-marker {
          fill: hsl(var(--foreground));
        }

        .text-display {
          padding: 0.75rem 1rem;
          background: hsl(var(--muted) / 0.3);
          border-radius: 6px;
          margin: 1rem 0;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .text-visualization {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 16px;
          line-height: 1.6;
          margin-top: 0.5rem;
          word-break: break-all;
        }

        .text-char {
          padding: 4px 6px;
          margin: 1px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .text-char.matched {
          background: #22c55e;
          color: white;
          font-weight: bold;
        }

        .text-char.current {
          background: #3b82f6;
          color: white;
          font-weight: bold;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .aho-corasick-demo {
            padding: 0;
            margin: 1rem 0;
          }

          .controls {
            padding: 1rem;
          }

          .text-input, .pattern-input {
            min-width: 100%;
            max-width: none;
            color: hsl(var(--foreground)) !important;
            background: hsl(var(--background)) !important;
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

          .text-visualization {
            font-size: 16px;
          }

          .visualization-container {
            padding: 0.5rem;
            min-height: 400px;
          }
        }

        @media (max-width: 480px) {
          .aho-corasick-demo {
            padding: 0;
          }

          .controls {
            padding: 0.75rem;
          }

          .preset-btn {
            font-size: 0.65rem;
            padding: 0.3rem 0.4rem;
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

          .text-visualization {
            font-size: 14px;
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
