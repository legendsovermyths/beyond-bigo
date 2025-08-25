import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SlideMultiplyDemoProps {
  defaultText?: string;
  defaultPattern?: string;
}

interface SignalData {
  [key: string]: number[];
}

interface CalculationStep {
  position: number;
  textSlice: string;
  pattern: string;
  textSignals: SignalData;
  patternSignals: SignalData;
  dotProducts: {
    [key: string]: {
      textVals: number[];
      patternVals: number[];
      products: number[];
      sum: number;
    };
  };
  totalScore: number;
  isMatch: boolean;
}

export default function SlideMultiplyDemo({ 
  defaultText = "ATCGATCG", 
  defaultPattern = "TCG" 
}: SlideMultiplyDemoProps) {
  const [text, setText] = useState(defaultText);
  const [pattern, setPattern] = useState(defaultPattern);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [calculations, setCalculations] = useState<CalculationStep[]>([]);

  // Calculate signal encoding and dot products for sliding window
  const calculateSteps = (textStr: string, patternStr: string): CalculationStep[] => {
    const steps: CalculationStep[] = [];
    const textUpper = textStr.toUpperCase().replace(/[^ATGC]/g, '');
    const patternUpper = patternStr.toUpperCase().replace(/[^ATGC]/g, '');
    
    if (!textUpper || !patternUpper) return steps;

    // DNA character types to encode
    const charTypes = ['A', 'T', 'G', 'C'];

    // Generate full text signals (for the entire text)
    const fullTextSignals: SignalData = {};
    charTypes.forEach(char => {
      fullTextSignals[char] = textUpper.split('').map(c => c === char ? 1 : 0);
    });

    for (let i = 0; i <= textUpper.length - patternUpper.length; i++) {
      const textSlice = textUpper.slice(i, i + patternUpper.length);
      
      // Create text signals for just this window
      const windowTextSignals: SignalData = {};
      charTypes.forEach(char => {
        windowTextSignals[char] = textSlice.split('').map(c => c === char ? 1 : 0);
      });

      // Create pattern signals 
      const patternSignals: SignalData = {};
      charTypes.forEach(char => {
        patternSignals[char] = patternUpper.split('').map(c => c === char ? 1 : 0);
      });

      // Calculate dot products for each character type
      const dotProducts: { [key: string]: { textVals: number[]; patternVals: number[]; products: number[]; sum: number } } = {};
      let totalScore = 0;

      charTypes.forEach(char => {
        const textVals = windowTextSignals[char];
        const patternVals = patternSignals[char];
        const products = textVals.map((tv, idx) => tv * patternVals[idx]);
        const sum = products.reduce((acc, val) => acc + val, 0);
        
        dotProducts[char] = {
          textVals,
          patternVals, 
          products,
          sum
        };
        
        totalScore += sum;
      });

      steps.push({
        position: i,
        textSlice,
        pattern: patternUpper,
        textSignals: { ...fullTextSignals }, // Keep full text for display
        patternSignals,
        dotProducts,
        totalScore,
        isMatch: totalScore === patternUpper.length
      });
    }

    return steps;
  };

  // Recalculate when text or pattern changes
  useEffect(() => {
    const newCalculations = calculateSteps(text, pattern);
    setCalculations(newCalculations);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [text, pattern]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || calculations.length === 0) return;

    const timer = setTimeout(() => {
      if (currentStep < calculations.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsPlaying(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, calculations.length]);

  const handlePlay = () => {
    if (calculations.length === 0) return;
    setIsPlaying(true);
    if (currentStep >= calculations.length - 1) {
      setCurrentStep(0);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleStepForward = () => {
    if (currentStep < calculations.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentCalculation = calculations[currentStep];

  return (
    <div className="slide-multiply-demo">
      {/* Controls */}
      <div className="controls">
        <div className="input-section">
          <Label htmlFor="slide-text-input">Search Text:</Label>
          <Input
            id="slide-text-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter DNA text (A,T,G,C)"
            className="text-input"
            maxLength={20}
          />
        </div>
        <div className="input-section">
          <Label htmlFor="slide-pattern-input">Pattern:</Label>
          <Input
            id="slide-pattern-input"
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter DNA pattern"
            className="pattern-input"
            maxLength={10}
          />
        </div>
        <div className="control-buttons">
          <Button 
            onClick={handlePlay} 
            disabled={isPlaying || calculations.length === 0}
            size="sm"
          >
            Play
          </Button>
          <Button 
            onClick={handleStop} 
            disabled={!isPlaying}
            size="sm"
            variant="secondary"
          >
            Stop
          </Button>
          <Button 
            onClick={handleReset}
            size="sm"
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Step Controls */}
      {calculations.length > 0 && (
        <div className="step-controls">
          <Button 
            onClick={handleStepBackward} 
            disabled={currentStep === 0 || isPlaying}
            size="sm"
            variant="ghost"
          >
            ← Prev
          </Button>
          <span className="step-counter">
            Step {currentStep + 1} of {calculations.length}
          </span>
          <Button 
            onClick={handleStepForward} 
            disabled={currentStep >= calculations.length - 1 || isPlaying}
            size="sm"
            variant="ghost"
          >
            Next →
          </Button>
        </div>
      )}

      {/* Visualization */}
      {currentCalculation && (
        <div className="visualization">
          {/* Text display with position indicators */}
          <div className="text-display">
            <div className="position-row">
              <span className="label">Position:</span>
              <div className="positions">
                {text.toUpperCase().replace(/[^ATGC]/g, '').split('').map((_, i) => (
                  <span key={i} className="position-num">{i}</span>
                ))}
              </div>
            </div>
            <div className="text-row">
              <span className="label">Text:</span>
              <div className="sequence">
                {text.toUpperCase().replace(/[^ATGC]/g, '').split('').map((char, i) => (
                  <span
                    key={i}
                    className={`char ${
                      i >= currentCalculation.position && 
                      i < currentCalculation.position + pattern.length
                        ? 'highlighted'
                        : ''
                    }`}
                  >
                    {char}
                  </span>
                ))}
              </div>
             
            </div>
              {/* Pattern Display */}
              <div>
              <div className="pattern-row">
                <span className="label">Pattern:</span>
                <div className="sequence">
                  {/* Spacers for alignment */}
                  {Array(currentCalculation.position).fill(null).map((_, i) => (
                    <span key={`spacer-${i}`} className="char spacer">·</span>
                  ))}
                  {/* Pattern characters */}
                  {pattern.toUpperCase().replace(/[^ATGC]/g, '').split('').map((char, i) => (
                    <span key={i} className="char pattern-char">
                      {char}
                    </span>
                  ))}
                  {/* Trailing spacers */}
                  {Array(text.length - currentCalculation.position - pattern.length).fill(null).map((_, i) => (
                    <span key={`trail-${i}`} className="char spacer">·</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Signal Encoding */}
          <div className="signal-encoding">
            <h4>Signal Encoding (Text → Binary Vectors):</h4>
            {['A', 'T', 'G', 'C'].map(char => (
              <div key={char} className="signal-row">
                <span className="signal-label">T_{char}[i]:</span>
                <div className="signal-values">
                  {currentCalculation.textSignals[char].map((val, i) => (
                    <span
                      key={i}
                      className={`signal-bit ${val ? 'active' : ''} ${
                        i >= currentCalculation.position && 
                        i < currentCalculation.position + pattern.length
                          ? 'in-window'
                          : ''
                      }`}
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pattern Signals (Aligned) */}
          <div className="pattern-encoding">
            <h4>Pattern Signals (Aligned at position {currentCalculation.position}):</h4>
            

            {/* Signal Encoding for Pattern */}
            {['A', 'T', 'G', 'C'].map(char => (
              <div key={char} className="signal-row">
                <span className="signal-label">P_{char}[j]:</span>
                <div className="signal-values">
                  {/* Spacers for alignment */}
                  {Array(currentCalculation.position).fill(null).map((_, i) => (
                    <span key={`spacer-${i}`} className="signal-bit spacer">·</span>
                  ))}
                  {/* Pattern values */}
                  {currentCalculation.patternSignals[char].map((val, i) => (
                    <span key={i} className={`signal-bit pattern-bit ${val ? 'active' : ''}`}>
                      {val}
                    </span>
                  ))}
                  {/* Trailing spacers */}
                  {Array(text.length - currentCalculation.position - pattern.length).fill(null).map((_, i) => (
                    <span key={`trail-${i}`} className="signal-bit spacer">·</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Dot Product Calculations */}
          <div className="dot-product-section">
            <h4>Dot Product Calculations:</h4>
            <div className="formula-display">
              <span className="formula">
                Score = Σ(T_A × P_A) + Σ(T_T × P_T) + Σ(T_G × P_G) + Σ(T_C × P_C)
              </span>
            </div>
            
            {['A', 'T', 'G', 'C'].map(char => {
              const dp = currentCalculation.dotProducts[char];
              return (
                <div key={char} className="char-calculation">
                  <div className="char-header">Character '{char}' contribution:</div>
                  <div className="dot-product-row">
                    <div className="vectors">
                      <div className="vector-display">
                        <span className="vector-label">Text:</span>
                        {dp.textVals.map((val, i) => (
                          <span key={i} className={`vector-val ${val ? 'active' : ''}`}>
                            {val}
                          </span>
                        ))}
                      </div>
                      <div className="vector-display">
                        <span className="vector-label">Pattern:</span>
                        {dp.patternVals.map((val, i) => (
                          <span key={i} className={`vector-val pattern ${val ? 'active' : ''}`}>
                            {val}
                          </span>
                        ))}
                      </div>
                      <div className="vector-display">
                        <span className="vector-label">Product:</span>
                        {dp.products.map((val, i) => (
                          <span key={i} className={`vector-val product ${val ? 'match' : ''}`}>
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="sum-display">
                      <span className="sum-label">Sum:</span>
                      <span className="sum-value">{dp.sum}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="total-score">
              <span className="total-label">Total Match Score:</span>
              <span className={`total-value ${currentCalculation.isMatch ? 'perfect-match' : ''}`}>
                {currentCalculation.totalScore}/{pattern.length}
              </span>
              {currentCalculation.isMatch && (
                <span className="match-indicator">Perfect Match!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {calculations.length === 0 && text && pattern && (
        <div className="no-results">
          <p>Please enter valid DNA sequences (A, T, G, C) to see the comparison.</p>
        </div>
      )}

      <style>{`
        .slide-multiply-demo {
          margin: 1.5rem 0;
          padding: 0;
          background: transparent;
          border: none;
          color: inherit;
        }

        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          background: hsl(var(--muted) / 0.3);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .input-section {
          gap: 0.5rem;
        }

        .text-input, .pattern-input {
          min-width: 200px;
          max-width: 300px;
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--background)) !important;
        }

        .control-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .step-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: hsl(var(--muted) / 0.3);
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .step-counter {
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          font-size: 0.9rem;
        }

        .visualization {
          background: hsl(var(--background) / 0.5);
          border-radius: 6px;
          padding: 1rem;
          border: 1px solid hsl(var(--border) / 0.4);
        }

        .text-display, .pattern-display {
          margin-bottom: 1.5rem;
          padding: 0.75rem;
          background: hsl(var(--muted) / 0.3);
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .position-row, .text-row, .pattern-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .label {
          min-width: 80px;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
        }

        .positions, .sequence {
          display: flex;
          gap: 2px;
        }

        .position-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 20px;
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .char {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: 1px solid hsl(var(--border));
          border-radius: 4px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          transition: all 0.3s ease;
        }

        .char.highlighted {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
          transform: scale(1.05);
        }

        .char.pattern-char {
          background: #ef4444;
          color: white;
          border-color: #dc2626;
          font-weight: 700;
        }

        .char.spacer {
          border: none;
          background: transparent;
          color: hsl(var(--muted-foreground));
          opacity: 0.3;
        }

        .signal-encoding, .pattern-encoding, .dot-product-section {
          margin: 1.5rem 0;
          padding: 1rem;
          background: hsl(var(--muted) / 0.3);
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .signal-encoding h4, .pattern-encoding h4, .dot-product-section h4 {
          margin-bottom: 1rem;
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        .signal-row {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .signal-label {
          min-width: 70px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        .signal-values {
          display: flex;
          gap: 2px;
          flex-wrap: wrap;
        }

        .signal-bit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 26px;
          border: 1px solid hsl(var(--border));
          border-radius: 3px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          font-size: 0.875rem;
          background: hsl(var(--background));
          color: hsl(var(--muted-foreground));
          transition: all 0.3s ease;
        }

        .signal-bit.active {
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
        }

        .signal-bit.in-window {
          border-color: #f59e0b;
          border-width: 2px;
        }

        .signal-bit.pattern-bit {
          background: hsl(var(--secondary));
          border-color: hsl(var(--secondary));
        }

        .signal-bit.pattern-bit.active {
          background: #ef4444;
          color: white;
          border-color: #dc2626;
        }

        .signal-bit.spacer {
          border: none;
          background: transparent;
          color: hsl(var(--muted-foreground));
          opacity: 0.3;
        }

        .formula-display {
          text-align: center;
          margin-bottom: 1.5rem;
          padding: 0.75rem;
          background: hsl(var(--background) / 0.5);
          border-radius: 4px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .formula {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 1rem;
          font-weight: 600;
          color: hsl(var(--primary));
        }

        .char-calculation {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: hsl(var(--background) / 0.3);
          border-radius: 4px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .char-header {
          font-weight: 600;
          margin-bottom: 1rem;
          color: hsl(var(--foreground));
        }

        .dot-product-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .vectors {
          flex: 1;
        }

        .vector-display {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .vector-label {
          min-width: 60px;
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
        }

        .vector-val {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 1px solid hsl(var(--border));
          border-radius: 3px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          font-size: 0.75rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          margin-right: 2px;
        }

        .vector-val.active {
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
        }

        .vector-val.pattern.active {
          background: #ef4444;
          color: white;
          border-color: #dc2626;
        }

        .vector-val.product.match {
          background: #22c55e;
          color: white;
          border-color: #16a34a;
        }

        .sum-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: hsl(var(--muted) / 0.3);
          border-radius: 4px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .sum-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          margin-bottom: 0.25rem;
        }

        .sum-value {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: bold;
          font-size: 1.1rem;
          color: hsl(var(--foreground));
        }

        .total-score {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
          margin-top: 1.5rem;
          background: hsl(var(--background) / 0.5);
          border-radius: 6px;
          border: 1px solid hsl(var(--primary) / 0.4);
          flex-wrap: wrap;
        }

        .total-label {
          font-weight: 600;
          color: hsl(var(--muted-foreground));
        }

        .total-value {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: bold;
          font-size: 1.5rem;
          color: hsl(var(--foreground));
        }

        .total-value.perfect-match {
          color: #22c55e;
        }

        .match-indicator {
          color: #22c55e;
          font-weight: 600;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .no-results {
          text-align: center;
          padding: 2rem;
          color: hsl(var(--muted-foreground));
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .slide-multiply-demo {
            padding: 0;
            margin: 1rem 0;
          }

          .controls {
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
          }

          .input-section {
            width: 100%;
          }

          .text-input, .pattern-input {
            width: 100%;
            min-width: 100%;
            color: hsl(var(--foreground)) !important;
            background: hsl(var(--background)) !important;
          }

          .control-buttons {
            justify-content: center;
          }

          .step-controls {
            flex-direction: column;
            gap: 0.75rem;
          }

          .signal-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .signal-label, .vector-label {
            min-width: auto;
          }

          .dot-product-row {
            flex-direction: column;
            align-items: stretch;
          }

          .char, .signal-bit, .vector-val {
            width: 24px;
            height: 24px;
            font-size: 0.75rem;
          }

          .position-num {
            width: 24px;
          }

          .total-score {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .slide-multiply-demo {
            padding: 0;
          }

          .controls {
            padding: 0.75rem;
          }

          .char, .signal-bit, .vector-val {
            width: 20px;
            height: 20px;
            font-size: 0.7rem;
          }

          .position-num {
            width: 20px;
            font-size: 0.7rem;
          }

          .formula {
            font-size: 0.9rem;
          }

          .signal-values, .vector-display {
            gap: 1px;
          }

          .vector-val {
            margin-right: 1px;
          }
        }
      `}</style>
    </div>
  );
}
