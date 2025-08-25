import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import DemoRenderer from './DemoRenderer';

interface InteractiveBlogRendererProps {
  content: string;
}

// Fallback CDN loading function
const loadLibrariesFromCDN = async () => {
  console.log('🔄 Loading libraries from fallback CDN...');
  
  const libraries = [
    { name: 'p5', url: 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js', check: () => typeof (window as any).p5 !== 'undefined' },
    { name: 'd3', url: 'https://d3js.org/d3.v7.min.js', check: () => typeof (window as any).d3 !== 'undefined' }
  ];
  
  for (const lib of libraries) {
    if (!lib.check()) {
      console.log(`📦 Loading ${lib.name} from CDN...`);
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = lib.url;
        script.async = false;
        script.defer = false;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          console.log(`✅ ${lib.name} loaded from CDN`);
          setTimeout(resolve, 200);
        };
        script.onerror = () => {
          console.error(`❌ Failed to load ${lib.name} from CDN`);
          resolve(undefined);
        };
        document.head.appendChild(script);
      });
    }
  }
  
  // Final check
  const p5Available = typeof (window as any).p5 !== 'undefined';
  const d3Available = typeof (window as any).d3 !== 'undefined';
  console.log('📊 Final library status after CDN loading:', { p5Available, d3Available });
};

// Demo directive parser
interface DemoDirective {
  type: string;
  props: Record<string, any>;
  id: string;
}

const parseDemoDirectives = (content: string): { content: string; demos: Map<string, DemoDirective> } => {
  const demos = new Map<string, DemoDirective>();
  let processedContent = content;

  // Match demo directives: :::demo-TYPE\nkey: value\n:::
  const demoRegex = /:::demo-([a-z-]+)\n([\s\S]*?):::/g;
  
  processedContent = processedContent.replace(demoRegex, (match, demoType, propsString) => {
    const id = `demo_${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse properties
    const props: Record<string, any> = {};
    if (propsString.trim()) {
      propsString.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          // Try to parse as JSON, fallback to string
          try {
            props[key.trim()] = JSON.parse(value);
          } catch {
            props[key.trim()] = value;
          }
        }
      });
    }

    demos.set(id, {
      type: demoType,
      props,
      id
    });

    // Replace with a placeholder that will be rendered as a React component
    return `<div data-demo-id="${id}" data-demo-type="${demoType}"></div>`;
  });

  return { content: processedContent, demos };
};

export default function InteractiveBlogRenderer({ content }: InteractiveBlogRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedContent, setProcessedContent] = useState(content);
  const [demoDirectives, setDemoDirectives] = useState<Map<string, DemoDirective>>(new Map());
  const scriptsExecuted = useRef(new Set<string>());

  useEffect(() => {
    // Extract and execute scripts after content is rendered
    const executeScripts = async () => {
      if (!containerRef.current) return;

      console.log('Starting script execution...');
      const scripts = containerRef.current.querySelectorAll('script');
      console.log(`Found ${scripts.length} scripts`);
      
      // Process external scripts first
      const externalScripts = Array.from(scripts).filter(script => script.src);
      console.log(`External scripts: ${externalScripts.length}`);
      
      for (const script of externalScripts) {
        const src = script.getAttribute('src');
        if (!src) continue;
        
        const isP5Script = src.includes('p5');
        const isD3Script = src.includes('d3');
        const p5Available = typeof (window as any).p5 !== 'undefined';
        const d3Available = typeof (window as any).d3 !== 'undefined';
        
        // If library is already available, skip
        if ((isP5Script && p5Available) || (isD3Script && d3Available)) {
          console.log(`Library already available for: ${src}`);
          continue;
        }
        
        // Remove existing script first if library isn't available
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript && !((isP5Script && p5Available) || (isD3Script && d3Available))) {
          console.log(`Removing non-functional script: ${src}`);
          existingScript.remove();
        }
        
        // Always load fresh script if library isn't available
        console.log(`Loading external script: ${src}`);
        await new Promise((resolve) => {
          const newScript = document.createElement('script');
          newScript.src = src;
          newScript.async = false;
          newScript.defer = false;
          newScript.crossOrigin = 'anonymous';
          
          newScript.onload = () => {
            console.log(`Script loaded: ${src}`);
            // Wait for library to initialize
            setTimeout(() => {
              const p5Check = typeof (window as any).p5 !== 'undefined';
              const d3Check = typeof (window as any).d3 !== 'undefined';
              console.log(`Post-load library check: p5=${p5Check}, d3=${d3Check}`);
              resolve(undefined);
            }, 500);
          };
          
          newScript.onerror = (e) => {
            console.error(`Failed to load: ${src}`, e);
            resolve(undefined);
          };
          
          document.head.appendChild(newScript);
        });
      }

      // Final verification of external libraries
      console.log('Final library verification...');
      await new Promise(resolve => {
        let attempts = 0;
        const maxAttempts = 6; // 3 seconds max
        
        const checkLibraries = () => {
          attempts++;
          const p5Available = typeof (window as any).p5 !== 'undefined';
          const d3Available = typeof (window as any).d3 !== 'undefined';
          
          console.log(`Final library check ${attempts}/${maxAttempts}:`, { p5Available, d3Available });
          
          // Check what libraries we actually need
          const hasP5Script = externalScripts.some(s => s.src?.includes('p5'));
          const hasD3Script = externalScripts.some(s => s.src?.includes('d3'));
          
          const needsP5 = hasP5Script ? p5Available : true;
          const needsD3 = hasD3Script ? d3Available : true;
          
          if ((needsP5 && needsD3) || attempts >= maxAttempts) {
            if (attempts >= maxAttempts && (hasP5Script || hasD3Script)) {
              console.warn('⚠️ Library loading timeout - trying fallback CDN loading');
              // Fallback: force load from CDN
              loadLibrariesFromCDN().then(() => resolve(undefined));
            } else {
              console.log('✅ All required libraries available');
              resolve(undefined);
            }
          } else {
            setTimeout(checkLibraries, 500);
          }
        };
        
        checkLibraries();
      });

      // Then process inline scripts (filter out CSS content)
      const inlineScripts = Array.from(scripts).filter(script => {
        if (script.src) return false;
        const content = script.textContent || '';
        
        // Filter out CSS content and empty scripts
        if (!content.trim()) return false;
        
        // Check if this is actually JavaScript code (positive indicators)
        const hasJSKeywords = /^(class\s+|function\s+|const\s+|let\s+|var\s+|\/\*|\/\/|window\.|document\.)/.test(content.trim()) ||
                              content.includes('constructor(') ||
                              content.includes('addEventListener') ||
                              content.includes('getElementById') ||
                              content.includes('querySelector') ||
                              content.includes('new ') ||
                              content.includes('this.') ||
                              content.includes('return ') ||
                              content.includes('console.log');
        
        // Check if this looks like CSS (negative indicators for JS)
        const hasCSSPatterns = content.includes('background:') ||
                               content.includes('color:') ||
                               content.includes('margin:') ||
                               content.includes('padding:') ||
                               content.includes('display:') ||
                               content.includes('position:') ||
                               content.includes('font-size:') ||
                               content.includes('border:') ||
                               content.includes('width:') ||
                               content.includes('height:') ||
                               content.includes('@media') ||
                               /^\s*\.[a-zA-Z-]/.test(content);
        
        // If it has JS keywords and doesn't look like CSS, include it
        if (hasJSKeywords && !hasCSSPatterns) {
          return true;
        }
        
        // If it has CSS patterns and no clear JS keywords, filter it out
        if (hasCSSPatterns && !hasJSKeywords) {
          console.log('Filtering out CSS block:', content.slice(0, 100));
          return false;
        }
        
        // If it's mixed content, prefer to include it (err on side of execution)
        return true;
      });
      console.log(`Inline scripts: ${inlineScripts.length}`);
      
      for (const [index, script] of inlineScripts.entries()) {
        const scriptContent = script.textContent || script.innerHTML;
        const scriptId = `script-${index}-${scriptContent.slice(0, 50).replace(/\s+/g, '')}`;
        
        if (!scriptsExecuted.current.has(scriptId) && scriptContent.trim()) {
          try {
            console.log(`Executing inline script ${index + 1}/${inlineScripts.length}`);
            
            // Wait for DOM elements to be available
            await new Promise(resolve => {
              const checkDOM = () => {
                const container = containerRef.current;
                if (!container) {
                  setTimeout(checkDOM, 100);
                  return;
                }
                
                const allElements = container.querySelectorAll('*').length;
                const hasButtons = container.querySelectorAll('button').length > 0;
                const hasInputs = container.querySelectorAll('input').length > 0;
                const hasDivs = container.querySelectorAll('div').length > 5;
                
                console.log(`DOM check: ${allElements} elements, buttons: ${hasButtons}, inputs: ${hasInputs}, divs: ${hasDivs}`);
                
                if (allElements > 20 && (hasButtons || hasInputs || hasDivs)) {
                  resolve(undefined);
                } else {
                  setTimeout(checkDOM, 100);
                }
              };
              checkDOM();
            });
            
            // Execute in global scope
            const executeInGlobalScope = new Function(scriptContent);
            executeInGlobalScope();
            
            scriptsExecuted.current.add(scriptId);
            console.log(`Successfully executed script ${index + 1}`);
            
            // Wait between scripts
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`Error executing script ${index + 1}:`, error);
            console.error('Script content preview:', scriptContent.slice(0, 200));
          }
        }
      }
      
      console.log('Script execution completed');
    };

    // Wait longer for DOM to be fully ready
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        // Additional delay to ensure all content is rendered
        setTimeout(executeScripts, 500);
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [processedContent]);

  // Pre-process content to handle demo directives and math delimiters
  useEffect(() => {
    const processContent = async () => {
      console.log('🔧 Starting content processing...');
      
      // STEP 0: Parse demo directives first
      const { content: contentWithDemos, demos } = parseDemoDirectives(content);
      setDemoDirectives(demos);
      console.log(`🎮 Found ${demos.size} demo directive(s)`);
      
      let processed = contentWithDemos;
      
      console.log('🔢 Starting math processing...');
      
      // Wait for KaTeX to be available
      const waitForKaTeX = () => {
        return new Promise<void>((resolve) => {
          if (typeof (window as any).katex !== 'undefined') {
            resolve();
          } else {
            setTimeout(() => waitForKaTeX().then(resolve), 100);
          }
        });
      };

      await waitForKaTeX();
      
      // STEP 1: Extract script and style blocks to protect them from math processing
      const scriptBlocks: { placeholder: string; content: string }[] = [];
      const styleBlocks: { placeholder: string; content: string }[] = [];
      
      // Extract <script> blocks (including content)
      processed = processed.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
        const placeholder = `__SCRIPT_PLACEHOLDER_${scriptBlocks.length}__`;
        scriptBlocks.push({ placeholder, content: match });
        console.log(`📝 Extracted script block ${scriptBlocks.length - 1}`);
        return placeholder;
      });
      
      // Extract <style> blocks (including content)
      processed = processed.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, content) => {
        const placeholder = `__STYLE_PLACEHOLDER_${styleBlocks.length}__`;
        styleBlocks.push({ placeholder, content: match });
        console.log(`🎨 Extracted style block ${styleBlocks.length - 1}`);
        return placeholder;
      });
      
      console.log(`🛡️ Protected ${scriptBlocks.length} script blocks and ${styleBlocks.length} style blocks`);
      
      // STEP 2: Process math on the remaining content (script/style blocks are now placeholders)
      // Process display math ($$...$$) by rendering directly with KaTeX
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
        try {
          const renderedMath = (window as any).katex.renderToString(formula.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
          return `<div class="math-display-rendered">${renderedMath}</div>`;
        } catch (error) {
          console.error('Error rendering display math:', formula, error);
          return `<div class="math-error">Error: ${formula}</div>`;
        }
      });

      // Process inline math ($...$) 
      processed = processed.replace(/\$([^$\n]+)\$/g, (match, formula) => {
        try {
          const renderedMath = (window as any).katex.renderToString(formula.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html'
          });
          return `<span class="math-inline-rendered">${renderedMath}</span>`;
        } catch (error) {
          console.error('Error rendering inline math:', formula, error);
          return `<span class="math-error">Error: ${formula}</span>`;
        }
      });

      // Convert LaTeX bracket notation
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
        try {
          const renderedMath = (window as any).katex.renderToString(formula.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
          return `<div class="math-display-rendered">${renderedMath}</div>`;
        } catch (error) {
          return `<div class="math-error">Error: ${formula}</div>`;
        }
      });

      // Convert LaTeX paren notation  
      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
        try {
          const renderedMath = (window as any).katex.renderToString(formula.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html'
          });
          return `<span class="math-inline-rendered">${renderedMath}</span>`;
        } catch (error) {
          return `<span class="math-error">Error: ${formula}</span>`;
        }
      });

      // STEP 3: Re-insert the original script and style blocks
      scriptBlocks.forEach((block) => {
        processed = processed.replace(block.placeholder, block.content);
      });
      
      styleBlocks.forEach((block) => {
        processed = processed.replace(block.placeholder, block.content);
      });
      
      console.log('✅ Math processing completed - script and style blocks restored');
      setProcessedContent(processed);
    };

    processContent();
  }, [content]);

  // Force re-execution when content changes
  useEffect(() => {
    scriptsExecuted.current.clear();
  }, [content]);

  return (
    <div ref={containerRef} className="prose prose-lg max-w-none">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-3xl font-semibold mb-6 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display text-2xl font-medium mb-4 text-foreground mt-12">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display text-xl font-medium mb-3 text-foreground mt-8">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-display text-lg font-medium mb-2 text-foreground mt-6">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground">
              {children}
            </p>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className={className}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-6 border">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground my-6">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 pl-6 list-disc">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 pl-6 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-2 text-foreground">
              {children}
            </li>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary underline decoration-1 underline-offset-2 hover:decoration-2 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
              {children}
            </td>
          ),
          div: ({ children, ...props }) => {
            // Check if this is a demo directive placeholder
            const demoId = props['data-demo-id'];
            const demoType = props['data-demo-type'];
            
            if (demoId && demoType && demoDirectives.has(demoId)) {
              const demo = demoDirectives.get(demoId)!;
              
              // Use the new DemoRenderer component
              return (
                <DemoRenderer 
                  demoId={demo.type} 
                  props={demo.props}
                  className="my-6"
                />
              );
            }
            
            return (
              <div {...props}>
                {children}
              </div>
            );
          },
          span: ({ children, ...props }) => (
            <span {...props}>
              {children}
            </span>
          ),
          button: ({ children, ...props }) => (
            <button {...props}>
              {children}
            </button>
          ),
          input: ({ ...props }) => {
            // Fix React warning by providing onChange for controlled inputs
            const { value, onChange, ...otherProps } = props;
            if (value !== undefined && !onChange) {
              return <input {...otherProps} defaultValue={value} />;
            }
            return <input {...props} />;
          },
          label: ({ children, ...props }) => (
            <label {...props}>
              {children}
            </label>
          ),
          canvas: ({ ...props }) => (
            <canvas {...props} />
          ),
          svg: ({ children, ...props }) => (
            <svg {...props}>
              {children}
            </svg>
          ),
          script: ({ children, ...props }) => (
            <script {...props}>
              {children}
            </script>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
