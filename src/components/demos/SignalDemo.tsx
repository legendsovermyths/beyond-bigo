import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignalDemoProps {
  defaultSequence?: string;
}

export default function SignalDemo({ 
  defaultSequence = "AGGCGTA" 
}: SignalDemoProps) {
  const [sequence, setSequence] = useState(defaultSequence);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate signal data (1 for G, 0 for others)
  const generateSignal = (dnaSequence: string): number[] => {
    const cleanSequence = dnaSequence.toUpperCase().replace(/[^ATGC]/g, '');
    return cleanSequence.split('').map(char => char === 'G' ? 1 : 0);
  };

  // Draw the signal graph
  const drawSignalGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dnaSequence = sequence.toUpperCase().replace(/[^ATGC]/g, '') || 'AGGCGTA';
    const signal = generateSignal(dnaSequence);

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get CSS custom properties for theming
    const rootStyles = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.classList.contains('dark');
    
    // Theme-aware colors
    const bgColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const secondaryTextColor = isDark ? '#94a3b8' : '#64748b';
    const signalColor = isDark ? '#10b981' : '#059669';
    const axisColor = isDark ? '#475569' : '#334155';

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    const margin = 60;
    const plotWidth = rect.width - 2 * margin;
    const plotHeight = 100;
    const yStart = 40;

    // Title
    ctx.fillStyle = textColor;
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Signal for G in "${dnaSequence}"`, rect.width / 2, 25);

    // Draw axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(margin, yStart);
    ctx.lineTo(margin, yStart + plotHeight);
    // X-axis
    ctx.moveTo(margin, yStart + plotHeight);
    ctx.lineTo(margin + plotWidth, yStart + plotHeight);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = textColor;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('1', margin - 8, yStart + 15);
    ctx.fillText('0', margin - 8, yStart + plotHeight - 5);

    if (signal.length === 0) return;

    // Draw signal line
    ctx.strokeStyle = signalColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    signal.forEach((value, i) => {
      const x = margin + (i / Math.max(signal.length - 1, 1)) * plotWidth;
      const signalY = yStart + plotHeight - (value * plotHeight * 0.7) - 15;

      if (i === 0) {
        ctx.moveTo(x, signalY);
      } else {
        const prevX = margin + ((i - 1) / Math.max(signal.length - 1, 1)) * plotWidth;
        const prevValue = signal[i - 1];
        const prevSignalY = yStart + plotHeight - (prevValue * plotHeight * 0.7) - 15;
        
        // Create step function
        ctx.lineTo(x, prevSignalY);
        ctx.lineTo(x, signalY);
      }
    });

    // Complete the line to the right edge
    if (signal.length > 0) {
      const lastX = margin + plotWidth;
      const lastValue = signal[signal.length - 1];
      const lastSignalY = yStart + plotHeight - (lastValue * plotHeight * 0.7) - 15;
      ctx.lineTo(lastX, lastSignalY);
    }
    ctx.stroke();

    // Draw points and labels
    signal.forEach((value, i) => {
      const x = margin + (i / Math.max(signal.length - 1, 1)) * plotWidth;
      const signalY = yStart + plotHeight - (value * plotHeight * 0.7) - 15;

      // Draw point
      ctx.fillStyle = signalColor;
      ctx.beginPath();
      ctx.arc(x, signalY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Add white border for better visibility
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Value label
      ctx.fillStyle = textColor;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x, signalY + (value === 1 ? -10 : 16));

      // Position number
      ctx.fillStyle = secondaryTextColor;
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(i.toString(), x, yStart + plotHeight + 15);

      // DNA base
      ctx.fillStyle = dnaSequence[i] === 'G' ? signalColor : textColor;
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(dnaSequence[i], x, yStart + plotHeight + 30);
    });

    // Position label
    ctx.fillStyle = secondaryTextColor;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Position', rect.width / 2, yStart + plotHeight + 45);

    // Explanation
    ctx.fillStyle = textColor;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('Signal = 1 when we see G, 0 otherwise', rect.width / 2, yStart + plotHeight + 62);
  };

  // Redraw when sequence changes or component mounts
  useEffect(() => {
    drawSignalGraph();
  }, [sequence]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawSignalGraph, 50);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sequence]);

  const handleSequenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^ATGC]/g, '');
    setSequence(value);
  };

  const signal = generateSignal(sequence);
  const cleanSequence = sequence.toUpperCase().replace(/[^ATGC]/g, '');

  return (
    <div className="signal-demo">
      {/* Input */}
      <div className="controls">
        <Label htmlFor="signal-dna-input">DNA Sequence:</Label>
        <Input
          id="signal-dna-input"
          type="text"
          value={sequence}
          onChange={handleSequenceChange}
          placeholder="Enter DNA sequence (A,T,G,C)"
          className="sequence-input"
          maxLength={15}
        />
      </div>

      {/* Visualization */}
      {cleanSequence && (
        <>
          <canvas 
            ref={canvasRef}
            className="signal-canvas"
            width={700}
            height={200}
          />
          
          {/* Signal Data */}
          <div className="signal-data">
            <div className="data-row">
              <span className="data-label">Position:</span>
              {cleanSequence.split('').map((_, i) => (
                <span key={i} className="data-cell position">{i}</span>
              ))}
            </div>
            <div className="data-row">
              <span className="data-label">Base:</span>
              {cleanSequence.split('').map((base, i) => (
                <span key={i} className={`data-cell base ${base === 'G' ? 'highlight' : ''}`}>
                  {base}
                </span>
              ))}
            </div>
            <div className="data-row">
              <span className="data-label">Signal:</span>
              {signal.map((value, i) => (
                <span key={i} className={`data-cell signal ${value === 1 ? 'active' : ''}`}>
                  {value}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {!cleanSequence && (
        <p className="no-data">Enter a DNA sequence to see the signal visualization.</p>
      )}

      <style>{`
        .signal-demo {
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
          align-items: center;
          margin-bottom: 1.5rem;
          background: hsl(var(--muted) / 0.3);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .sequence-input {
          min-width: 250px;
          max-width: 350px;
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--background)) !important;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
        }



        .signal-canvas {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 500px;
          margin: 1rem 0;
          border-radius: 6px;
          background: hsl(var(--background) / 0.5);
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .signal-data {
          margin-top: 1rem;
          padding: 0.75rem;
          background: hsl(var(--muted) / 0.3);
          border-radius: 6px;
          border: 1px solid hsl(var(--border) / 0.3);
        }

        .data-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .data-label {
          min-width: 70px;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 0.875rem;
        }

        .data-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 28px;
          border: 1px solid hsl(var(--border));
          border-radius: 4px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          font-size: 0.875rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          margin-right: 2px;
        }

        .data-cell.position {
          background: hsl(var(--secondary));
          color: hsl(var(--secondary-foreground));
          font-size: 0.75rem;
        }

        .data-cell.base.highlight {
          background: #10b981;
          color: white;
          border-color: #059669;
        }

        .data-cell.signal.active {
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
        }

        .no-data {
          text-align: center;
          padding: 2rem;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .signal-demo {
            padding: 0;
            margin: 1rem 0;
          }

          .controls {
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .sequence-input {
            width: 100%;
            min-width: 100%;
            max-width: none;
            color: hsl(var(--foreground)) !important;
            background: hsl(var(--background)) !important;
          }

          .signal-canvas {
            min-width: 400px;
            height: 180px;
          }

          .data-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .data-label {
            min-width: auto;
          }

          .data-cell {
            width: 28px;
            height: 24px;
            font-size: 0.75rem;
            margin-right: 1px;
          }

          .info-text {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .signal-demo {
            padding: 0;
          }

          .controls {
            padding: 0.75rem;
          }

          .signal-canvas {
            min-width: 350px;
            height: 160px;
          }

          .data-cell {
            width: 24px;
            height: 22px;
            font-size: 0.7rem;
            margin-right: 1px;
          }
        }
      `}</style>
    </div>
  );
}
