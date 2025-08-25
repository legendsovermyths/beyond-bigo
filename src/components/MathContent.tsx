import { useEffect, useRef } from 'react';

interface MathContentProps {
  content: string;
}

declare global {
  interface Window {
    katex: any;
  }
}

export default function MathContent({ content }: MathContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const processMath = () => {
      if (!window.katex) {
        console.log('KaTeX not yet available, retrying...');
        setTimeout(processMath, 100);
        return;
      }

      console.log('Processing math with KaTeX...');
      
      let processedHTML = content;

      // Process display math ($$...$$)
      processedHTML = processedHTML.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
        try {
          const renderedMath = window.katex.renderToString(formula.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
          return `<div class="math-display">${renderedMath}</div>`;
        } catch (error) {
          console.error('Error rendering display math:', formula, error);
          return `<div class="math-error">$$${formula}$$</div>`;
        }
      });

      // Process inline math ($...$)
      processedHTML = processedHTML.replace(/\$([^$]+)\$/g, (match, formula) => {
        try {
          const renderedMath = window.katex.renderToString(formula.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html'
          });
          return `<span class="math-inline">${renderedMath}</span>`;
        } catch (error) {
          console.error('Error rendering inline math:', formula, error);
          return `<span class="math-error">$${formula}$</span>`;
        }
      });

      if (containerRef.current) {
        containerRef.current.innerHTML = processedHTML;
      }
    };

    processMath();
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className="math-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
