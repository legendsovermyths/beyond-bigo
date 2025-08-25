import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';

declare global {
  interface Window {
    katex: any;
  }
}

interface MathRendererProps {
  content: string;
  displayMode?: boolean;
}

export default function MathRenderer({ content, displayMode = false }: MathRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const loadKatex = async () => {
      if (!window.katex) {
        const katex = await import('katex');
        window.katex = katex.default;
      }

      if (containerRef.current && window.katex) {
        try {
          window.katex.render(content, containerRef.current, {
            displayMode,
            throwOnError: false,
            trust: true,
          });
        } catch (error) {
          console.error('KaTeX rendering error:', error);
          if (containerRef.current) {
            containerRef.current.textContent = content;
          }
        }
      }
    };

    loadKatex();
  }, [content, displayMode]);

  return <span ref={containerRef} />;
}
