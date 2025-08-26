import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FFTDemoProps {
  defaultText?: string;
  defaultPattern?: string;
}

interface ComplexNumber {
  real: number;
  imag: number;
}

interface StepData {
  textSignals: { [key: string]: number[] };
  patternSignals: { [key: string]: number[] };
  textFFT: { [key: string]: ComplexNumber[] };
  patternFFT: { [key: string]: ComplexNumber[] };
  multipliedFFT: { [key: string]: ComplexNumber[] };
  correlations: { [key: string]: number[] };
  finalScores: number[];
}

const STEPS = [
  'input', 'signals', 'text-fft', 'pattern-fft', 
  'multiply', 'ifft', 'results'
];

const STEP_NAMES = [
  'Input Processing', 'Binary Signals', 'Text FFT', 'Pattern FFT',
  'Frequency Multiplication', 'Inverse FFT', 'Final Results'
];

export default function FFTDemo({ 
  defaultText = "ATCGATCGATCG", 
  defaultPattern = "TCGA" 
}: FFTDemoProps) {
  const [text, setText] = useState(defaultText);
  const [pattern, setPattern] = useState(defaultPattern);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [stepData, setStepData] = useState<StepData | null>(null);
  const [progress, setProgress] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);
  const patternInputRef = useRef<HTMLInputElement>(null);
  const textCursorPosition = useRef(0);
  const patternCursorPosition = useRef(0);

  const bases = ['A', 'T', 'G', 'C'];
  const baseColors = ['#dc2626', '#2563eb', '#16a34a', '#d97706'];

  // Complex number operations
  const multiplyComplex = (a: ComplexNumber, b: ComplexNumber): ComplexNumber => ({
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real
  });

  const addComplex = (a: ComplexNumber, b: ComplexNumber): ComplexNumber => ({
    real: a.real + b.real,
    imag: a.imag + b.imag
  });

  const subtractComplex = (a: ComplexNumber, b: ComplexNumber): ComplexNumber => ({
    real: a.real - b.real,
    imag: a.imag - b.imag
  });

  const formatComplex = (complex: ComplexNumber): string => {
    const real = complex.real.toFixed(1);
    const imag = complex.imag.toFixed(1);
    if (Math.abs(complex.imag) < 0.1) return real;
    if (Math.abs(complex.real) < 0.1) return `${imag}i`;
    return `${real}${complex.imag >= 0 ? '+' : ''}${imag}i`;
  };

  // FFT implementation
  const fft = (input: (number | ComplexNumber)[]): ComplexNumber[] => {
    const signal = input.map(x => 
      typeof x === 'number' ? { real: x, imag: 0 } : x
    );
    
    const n = signal.length;
    if (n <= 1) return signal;
    
    const even: ComplexNumber[] = [];
    const odd: ComplexNumber[] = [];
    for (let i = 0; i < n; i += 2) {
      even.push(signal[i]);
      if (i + 1 < n) odd.push(signal[i + 1]);
    }
    
    const evenFFT = fft(even);
    const oddFFT = fft(odd);
    
    const result = new Array(n);
    for (let k = 0; k < n / 2; k++) {
      const angle = -2 * Math.PI * k / n;
      const wk = { real: Math.cos(angle), imag: Math.sin(angle) };
      const oddTerm = multiplyComplex(wk, oddFFT[k] || { real: 0, imag: 0 });
      
      result[k] = addComplex(evenFFT[k], oddTerm);
      result[k + n / 2] = subtractComplex(evenFFT[k], oddTerm);
    }
    
    return result;
  };

  // IFFT implementation
  const ifft = (complexArray: ComplexNumber[]): ComplexNumber[] => {
    const conjugated = complexArray.map(c => ({ real: c.real, imag: -c.imag }));
    const fftResult = fft(conjugated);
    return fftResult.map(c => ({ 
      real: c.real / complexArray.length, 
      imag: -c.imag / complexArray.length 
    }));
  };

  // Create padded signal for a specific base
  const createPaddedSignal = (sequence: string, char: string, paddedLength: number): number[] => {
    const signal = sequence.split('').map(c => c === char ? 1 : 0);
    while (signal.length < paddedLength) {
      signal.push(0);
    }
    return signal;
  };

  // Process inputs and prepare data
  const processInputs = () => {
    const cleanText = text.toUpperCase().replace(/[^ATGC]/g, '').substring(0, 12);
    const cleanPattern = pattern.toUpperCase().replace(/[^ATGC]/g, '').substring(0, 6);
    
    const n = Math.max(cleanText.length + cleanPattern.length - 1, 8);
    const paddedLength = Math.pow(2, Math.ceil(Math.log2(n)));
    
    return { cleanText, cleanPattern, paddedLength };
  };

  // Execute all steps and calculate data
  const calculateAllSteps = () => {
    const { cleanText, cleanPattern, paddedLength } = processInputs();
    
    // Step 1: Create signals
    const textSignals: { [key: string]: number[] } = {};
    const patternSignals: { [key: string]: number[] } = {};
    
    bases.forEach(base => {
      textSignals[base] = createPaddedSignal(cleanText, base, paddedLength);
      patternSignals[base] = createPaddedSignal(cleanPattern, base, paddedLength);
    });

    // Step 2: Calculate FFTs
    const textFFT: { [key: string]: ComplexNumber[] } = {};
    const patternFFT: { [key: string]: ComplexNumber[] } = {};
    
    bases.forEach(base => {
      textFFT[base] = fft(textSignals[base]);
      patternFFT[base] = fft(patternSignals[base]);
    });

    // Step 3: Multiply in frequency domain
    const multipliedFFT: { [key: string]: ComplexNumber[] } = {};
    
    bases.forEach(base => {
      multipliedFFT[base] = [];
      for (let i = 0; i < textFFT[base].length; i++) {
        const textComp = textFFT[base][i];
        const patternComp = patternFFT[base][i];
        const patternConj = { real: patternComp.real, imag: -patternComp.imag };
        multipliedFFT[base][i] = multiplyComplex(textComp, patternConj);
      }
    });

    // Step 4: Calculate IFFT for correlations
    const correlations: { [key: string]: number[] } = {};
    
    bases.forEach(base => {
      const ifftResult = ifft(multipliedFFT[base]);
      const correlationResults = ifftResult.map(c => Math.round(c.real));
      const validPositions = cleanText.length - cleanPattern.length + 1;
      correlations[base] = correlationResults.slice(0, validPositions);
    });

    // Step 5: Calculate final scores
    const finalScores: number[] = [];
    const maxValidPosition = cleanText.length - cleanPattern.length + 1;
    for (let i = 0; i < maxValidPosition; i++) {
      let score = 0;
      bases.forEach(base => {
        score += correlations[base][i] || 0;
      });
      finalScores.push(score);
    }

    return {
      textSignals,
      patternSignals,
      textFFT,
      patternFFT,
      multipliedFFT,
      correlations,
      finalScores
    };
  };

  // Run complete demo
  const runCompleteDemo = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setShowAllSteps(false);
    setStepData(calculateAllSteps());
    
    for (let i = 0; i < STEPS.length; i++) {
      setCurrentStep(i);
      setProgress((i + 1) / STEPS.length * 100);
      if (i < STEPS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Show all steps after completion
    setShowAllSteps(true);
    setIsRunning(false);
  };

  // Step through demo
  const stepThroughDemo = () => {
    if (isRunning) return;
    
    if (!stepData) {
      setStepData(calculateAllSteps());
      setCurrentStep(0);
      setProgress((1) / STEPS.length * 100);
      return;
    }
    
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setProgress((nextStep + 1) / STEPS.length * 100);
    } else {
      // If we're at the last step, show all steps after completion
      setShowAllSteps(true);
    }
  };

  // Reset demo
  const resetDemo = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setProgress(0);
    setStepData(null);
    setShowAllSteps(false);
  };

  // Update when inputs change
  useEffect(() => {
    resetDemo();
  }, [text, pattern]);

  const { cleanText, cleanPattern, paddedLength } = processInputs();

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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    textCursorPosition.current = input.selectionStart || 0;
    const newValue = input.value.toUpperCase().replace(/[^ATGC]/g, '');
    setText(newValue);
  };

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    patternCursorPosition.current = input.selectionStart || 0;
    const newValue = input.value.toUpperCase().replace(/[^ATGC]/g, '');
    setPattern(newValue);
  };

  // Restore cursor position after re-render
  useEffect(() => {
    if (textInputRef.current) {
      const newPosition = Math.min(textCursorPosition.current, text.length);
      textInputRef.current.setSelectionRange(newPosition, newPosition);
    }
  }, [text]);

  useEffect(() => {
    if (patternInputRef.current) {
      const newPosition = Math.min(patternCursorPosition.current, pattern.length);
      patternInputRef.current.setSelectionRange(newPosition, newPosition);
    }
  }, [pattern]);

  // Render step content
  const renderStepContent = (stepIndex?: number) => {
    if (!stepData) return null;

    const step = stepIndex !== undefined ? stepIndex : currentStep;
    switch (step) {
      case 0: // Input Processing
        return (
          <div className="step-content">
            <div className="input-display">
              <div className="text-row">
                <span className="step-label">Text:</span>
                <div className="sequence-display">
                  {cleanText.split('').map((char, i) => (
                    <span key={i} className={`sequence-char ${char}`}>{char}</span>
                  ))}
                </div>
              </div>
              <div className="text-row">
                <span className="step-label">Pattern:</span>
                <div className="sequence-display">
                  {cleanPattern.split('').map((char, i) => (
                    <span key={i} className={`sequence-char ${char}`}>{char}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="step-explanation">
              Text "{cleanText}" ({cleanText.length} chars) and pattern "{cleanPattern}" ({cleanPattern.length} chars). 
              Padding to {paddedLength} for FFT efficiency.
            </p>
          </div>
        );

      case 1: // Binary Signals
        return (
          <div className="step-content">
            <div className="signals-section">
              <h4>Text Signals:</h4>
              <div className="signals-grid">
                {bases.map((base, index) => (
                  <div key={base} className="signal-row">
                    <span className="signal-label" style={{ color: baseColors[index] }}>
                      T{base}:
                    </span>
                    <div className="signal-values">
                      {stepData.textSignals[base].map((bit, i) => (
                        <span key={i} className={`signal-bit ${bit ? 'one' : 'zero'} ${i >= cleanText.length ? 'padded' : ''}`}>
                          {bit}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="signals-section">
              <h4>Pattern Signals:</h4>
              <div className="signals-grid">
                {bases.map((base, index) => (
                  <div key={base} className="signal-row">
                    <span className="signal-label" style={{ color: baseColors[index] }}>
                      P{base}:
                    </span>
                    <div className="signal-values">
                      {stepData.patternSignals[base].map((bit, i) => (
                        <span key={i} className={`signal-bit ${bit ? 'one' : 'zero'} ${i >= cleanPattern.length ? 'padded' : ''}`}>
                          {bit}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="step-explanation">
              Each base gets its own binary signal. Text and pattern signals are padded to {paddedLength} for FFT efficiency.
            </p>
          </div>
        );

      case 2: // Text FFT
        return (
          <div className="step-content">
            <div className="fft-grid">
              {bases.map(base => (
                <div key={base} className="fft-row">
                  <div className="fft-label">FFT(T{base})</div>
                  <div className="complex-values">
                    {stepData.textFFT[base].map((complex, i) => (
                      <span key={i} className="complex-number">
                        {formatComplex(complex)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="step-explanation">
              Text signals transformed to frequency domain. Complex numbers represent frequency components.
            </p>
          </div>
        );

      case 3: // Pattern FFT
        return (
          <div className="step-content">
            <div className="fft-grid">
              {bases.map(base => (
                <div key={base} className="fft-row">
                  <div className="fft-label">FFT(P{base})</div>
                  <div className="complex-values">
                    {stepData.patternFFT[base].map((complex, i) => (
                      <span key={i} className="complex-number">
                        {formatComplex(complex)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="step-explanation">
              Pattern signals transformed to frequency domain for correlation calculation.
            </p>
          </div>
        );

      case 4: // Multiplication
        return (
          <div className="step-content">
            <div className="multiply-grid">
              {bases.map(base => (
                <div key={base} className="multiply-row">
                  <div>
                    <div className="multiply-label">FFT(T{base})</div>
                    <div className="complex-values">
                      {stepData.textFFT[base].map((c, i) => (
                        <span key={i} className="complex-number">{formatComplex(c)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="multiply-operator">×</div>
                  <div>
                    <div className="multiply-label">FFT(P{base})*</div>
                    <div className="complex-values">
                      {stepData.patternFFT[base].map((c, i) => (
                        <span key={i} className="complex-number">{formatComplex({ real: c.real, imag: -c.imag })}</span>
                      ))}
                    </div>
                  </div>
                  <div className="multiply-operator">=</div>
                  <div>
                    <div className="multiply-label">Result</div>
                    <div className="complex-values">
                      {stepData.multipliedFFT[base].map((c, i) => (
                        <span key={i} className="complex-number">{formatComplex(c)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="step-explanation">
              Element-wise multiplication in frequency domain with complex conjugate (*) - the magic of the convolution theorem!
            </p>
          </div>
        );

      case 5: // IFFT
        return (
          <div className="step-content">
            <div className="ifft-grid">
              {bases.map(base => (
                <div key={base} className="ifft-row">
                  <div className="fft-label">IFFT → Correlation for {base}</div>
                  <div className="correlation-values">
                    {stepData.correlations[base].map((val, i) => (
                      <span key={i} className="correlation-value">{val}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="step-explanation">
              Inverse FFT transforms back to time domain. Values show character matches at each position.
            </p>
          </div>
        );

      case 6: // Results
        return (
          <div className="step-content">
            <div className="results-grid">
              {bases.map(base => (
                <div key={base} className="character-result">
                  <div className="character-label">Character {base} Matches:</div>
                  <div className="correlation-values">
                    {stepData.correlations[base].map((val, i) => (
                      <span key={i} className="correlation-value">{val}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="final-scores">
              <h4>Final Match Scores:</h4>
              <div className="score-values">
                {stepData.finalScores.map((score, i) => (
                  <span 
                    key={i} 
                    className={`score-value ${score === cleanPattern.length ? 'perfect-match' : ''}`}
                  >
                    {score}
                  </span>
                ))}
              </div>
              <div className="match-info">
                Perfect matches (score = {cleanPattern.length}): {
                  stepData.finalScores.map((score, i) => 
                    score === cleanPattern.length ? `pos ${i}` : null
                  ).filter(x => x).join(', ') || 'none'
                }
              </div>
            </div>
            <p className="step-explanation">
              Final pattern matching complete! Score = {cleanPattern.length} indicates perfect matches.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fft-demo">
      {/* Controls */}
      <div className="controls">
        <div className="input-section">
          <Label htmlFor="fft-text-input">Text (DNA sequence):</Label>
          <Input
            ref={textInputRef}
            id="fft-text-input"
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyDown}
            placeholder="Enter DNA text (A,T,G,C)"
            className="sequence-input"
            maxLength={12}
            disabled={false}
          />
        </div>
        <div className="input-section">
          <Label htmlFor="fft-pattern-input">Pattern:</Label>
          <Input
            ref={patternInputRef}
            id="fft-pattern-input"
            type="text"
            value={pattern}
            onChange={handlePatternChange}
            onKeyDown={handlePatternKeyDown}
            placeholder="Enter pattern"
            className="sequence-input"
            maxLength={6}
            disabled={false}
          />
        </div>
        <div className="demo-buttons">
          <Button 
            onClick={runCompleteDemo} 
            disabled={isRunning}
            className="run-button"
          >
            Run Complete Demo
          </Button>
          <Button 
            onClick={stepThroughDemo} 
            disabled={isRunning}
            variant="secondary"
            className="step-button"
          >
            Step Through
          </Button>
          <Button 
            onClick={resetDemo}
            variant="outline"
            className="reset-button"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Step Display */}
      {stepData && !showAllSteps && (
        <div className="demo-step active">
          <h3>Step {currentStep + 1}: {STEP_NAMES[currentStep]}</h3>
          {renderStepContent()}
        </div>
      )}

      {/* All Steps Display (after completion) */}
      {stepData && showAllSteps && (
        <div className="all-steps">
          <h3>Complete FFT Pattern Matching Process</h3>
          {STEPS.map((step, index) => (
            <div key={step} className="demo-step completed">
              <h4>Step {index + 1}: {STEP_NAMES[index]}</h4>
              {renderStepContent(index)}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .fft-demo {
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
          align-items: flex-end;
          margin-bottom: 1.5rem;
          background: hsl(var(--muted) / 0.3);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .input-section {
          display: flex;
          gap: 0.5rem;
        }

        .sequence-input {
          min-width: 200px;
          max-width: 250px;
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--background)) !important;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .demo-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .demo-step {
          background: hsl(var(--background) / 0.5);
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.4);
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .demo-step.active {
          border: 2px solid hsl(var(--primary) / 0.6);
          background: hsl(var(--background) / 0.8);
        }

        .demo-step.completed {
          border: 1px solid hsl(var(--border) / 0.3);
          margin-bottom: 1rem;
          background: hsl(var(--background) / 0.3);
        }

        .all-steps {
          margin-bottom: 1.5rem;
        }

        .all-steps h3 {
          margin-bottom: 2rem;
          color: hsl(var(--foreground));
          text-align: center;
          font-size: 1.5rem;
        }

        .demo-step h3 {
          background: hsl(var(--primary) / 0.1);
          color: hsl(var(--primary));
          margin: 0;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid hsl(var(--border) / 0.3);
          font-size: 1rem;
          font-weight: 600;
        }

        .demo-step h4 {
          background: hsl(var(--muted) / 0.3);
          color: hsl(var(--foreground));
          margin: 0;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid hsl(var(--border) / 0.2);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .step-content {
          padding: 1rem;
        }

        .input-display {
          margin-bottom: 1rem;
        }

        .text-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .step-label {
          min-width: 80px;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .sequence-display {
          display: flex;
          gap: 2px;
          flex-wrap: wrap;
        }

        .sequence-char {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid hsl(var(--border));
          border-radius: 4px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: bold;
          font-size: 16px;
        }

        .sequence-char.A { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }
        .sequence-char.T { background: #dbeafe; border-color: #93c5fd; color: #2563eb; }
        .sequence-char.G { background: #dcfce7; border-color: #86efac; color: #16a34a; }
        .sequence-char.C { background: #fef3c7; border-color: #fcd34d; color: #d97706; }

        .signals-section {
          margin-bottom: 2rem;
        }

        .signals-section h4 {
          margin: 0 0 1rem 0;
          color: hsl(var(--foreground));
          font-weight: 600;
        }

        .signals-grid, .fft-grid, .ifft-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .signal-row, .fft-row, .ifft-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .signal-label, .fft-label {
          min-width: 60px;
          font-weight: bold;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .signal-values, .complex-values, .correlation-values {
          display: flex;
          gap: 3px;
          flex-wrap: wrap;
        }

        .signal-bit {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid hsl(var(--border));
          border-radius: 3px;
          font-weight: bold;
          font-size: 12px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .signal-bit.one {
          background: #10b981;
          color: white;
          border-color: #059669;
        }

        .signal-bit.zero {
          background: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
        }

        .signal-bit.padded {
          opacity: 0.4;
          border-style: dashed;
        }

        .complex-number, .correlation-value {
          background: hsl(var(--muted));
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid hsl(var(--border));
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 12px;
          color: hsl(var(--foreground));
        }

        .multiply-grid {
          display: grid;
          gap: 1rem;
        }

        .multiply-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: hsl(var(--muted));
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
        }

        .multiply-label {
          font-weight: bold;
          margin-bottom: 0.5rem;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .multiply-operator {
          font-size: 20px;
          font-weight: bold;
          color: hsl(var(--muted-foreground));
          text-align: center;
        }

        .results-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .character-result {
          background: hsl(var(--muted) / 0.3);
          padding: 0.75rem;
          border-radius: 4px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .character-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
          font-size: 0.9rem;
        }

        .final-scores {
          padding: 1rem;
          background: hsl(var(--background) / 0.5);
          border: 1px solid hsl(var(--primary) / 0.4);
          border-radius: 6px;
          margin-top: 1rem;
        }

        .final-scores h4 {
          margin: 0 0 0.5rem 0;
          color: hsl(var(--primary));
        }

        .score-values {
          display: flex;
          gap: 4px;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .score-value {
          width: 35px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: hsl(var(--background));
          border: 2px solid hsl(var(--primary));
          border-radius: 4px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: bold;
          color: hsl(var(--primary));
        }

        .score-value.perfect-match {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .match-info {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .step-explanation {
          background: hsl(var(--muted) / 0.3);
          padding: 0.75rem;
          border-radius: 4px;
          color: hsl(var(--foreground));
          font-style: italic;
          border-left: 3px solid hsl(var(--primary) / 0.6);
          margin-top: 0.75rem;
          font-size: 0.9rem;
        }

        .demo-progress {
          background: hsl(var(--muted) / 0.2);
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.3);
          margin-top: 1rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: hsl(var(--muted));
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, hsl(var(--primary)), #10b981);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .fft-demo {
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

          .sequence-input {
            width: 100%;
            min-width: 100%;
            max-width: none;
            color: hsl(var(--foreground)) !important;
            background: hsl(var(--background)) !important;
          }

          .demo-buttons {
            flex-direction: column;
            width: 100%;
          }

          .demo-buttons button {
            width: 100%;
          }

          .multiply-row {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 0.75rem;
          }

          .multiply-operator {
            margin: 0.5rem 0;
          }

          .text-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .signal-row, .fft-row, .ifft-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .sequence-char, .signal-bit {
            width: 20px;
            height: 20px;
            font-size: 10px;
          }

          .complex-number, .correlation-value, .score-value {
            font-size: 10px;
            padding: 2px 4px;
          }

          .score-value {
            width: 30px;
            height: 25px;
          }
        }

        @media (max-width: 480px) {
          .fft-demo {
            padding: 0;
          }

          .controls {
            padding: 0.75rem;
          }

          .sequence-char, .signal-bit {
            width: 18px;
            height: 18px;
            font-size: 9px;
          }

          .complex-number, .correlation-value {
            font-size: 9px;
            padding: 1px 2px;
          }

          .score-value {
            width: 25px;
            height: 22px;
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
}
