import React, { useEffect, useState, useMemo } from 'react';

interface Props {
  content: string;
  className?: string;
}

declare global {
  interface Window {
    katex: any;
  }
}

// Token types for our parser
type TokenType = 'text' | 'math-inline' | 'math-display';
interface Token {
  type: TokenType;
  content: string;
  id: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content, className = "" }) => {
  const [katexLoaded, setKatexLoaded] = useState(false);

  useEffect(() => {
    // Patch quirks mode if detected to allow KaTeX to run
    if (document.compatMode === 'BackCompat') {
        try {
            Object.defineProperty(document, 'compatMode', {
                value: 'CSS1Compat',
                configurable: true,
                writable: true
            });
        } catch (e) {
            console.warn("KaTeX requires standards mode, but page is in quirks mode. Patching failed.", e);
        }
    }

    // Check if KaTeX is loaded, if not, poll for it
    if (window.katex) {
      setKatexLoaded(true);
    } else {
      const interval = setInterval(() => {
        if (window.katex) {
          setKatexLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // 1. Pre-process content: Extract math into tokens so text processing doesn't break it
  const parsedContent = useMemo(() => {
    const tokens: Record<string, Token> = {};
    let tokenCounter = 0;

    // Helper to store math and return placeholder
    const storeMath = (math: string, display: boolean) => {
      const id = `__MATH_TOKEN_${tokenCounter++}__`;
      tokens[id] = {
        type: display ? 'math-display' : 'math-inline',
        content: math,
        id
      };
      return id;
    };

    // Step 1: Extract block math $$...$$
    // Using [\s\S] to match newlines inside blocks
    let text = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
      return storeMath(math, true);
    });

    // Step 2: Extract inline math $...$
    text = text.replace(/\$([^$\n]+?)\$/g, (match, math) => {
      return storeMath(math, false);
    });

    return { text, tokens };
  }, [content]);

  // Helper to render a string that might contain math tokens or bold syntax
  const renderSegment = (segmentText: string) => {
    // Split by token regex
    const parts = segmentText.split(/(__MATH_TOKEN_\d+__)/g);
    
    return parts.map((part, i) => {
      // Check if this part is a math token
      if (parsedContent.tokens[part]) {
        const token = parsedContent.tokens[part];
        
        if (!katexLoaded || !window.katex) {
          return <span key={i} className="font-mono text-xs text-slate-500">{token.content}</span>;
        }

        try {
          const html = window.katex.renderToString(token.content, {
            displayMode: token.type === 'math-display',
            throwOnError: false,
            strict: false,
            trust: true,
            output: 'html'
          });
          
          // Wrapper for display math to ensure formatting
          if (token.type === 'math-display') {
             return <div key={i} className="my-4 overflow-x-auto overflow-y-hidden" dangerouslySetInnerHTML={{ __html: html }} />;
          }
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
          console.warn("KaTeX error:", e);
          return <span key={i} className="text-red-500 font-mono text-sm">{token.content}</span>;
        }
      }

      // If not math, process markdown styles (bold)
      // Bold syntax: **text**
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <React.Fragment key={i}>
          {boldParts.map((subPart, j) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return <strong key={j} className="font-semibold text-slate-900">{subPart.slice(2, -2)}</strong>;
            }
            return <span key={j}>{subPart}</span>;
          })}
        </React.Fragment>
      );
    });
  };

  const lines = parsedContent.text.split('\n');

  return (
    <div className={`space-y-2 ${className}`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-2" />;

        // Headers
        if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-semibold mt-6 mb-3 text-indigo-900">{renderSegment(line.replace('### ', ''))}</h3>;
        if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-indigo-800 border-b border-indigo-100 pb-2">{renderSegment(line.replace('## ', ''))}</h2>;
        if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-extrabold mt-10 mb-6 text-indigo-900">{renderSegment(line.replace('# ', ''))}</h1>;
        
        // Bullet points
        if (trimmed.startsWith('- ')) return (
          <div key={index} className="flex items-start ml-4 mb-2">
            <span className="mr-2 text-indigo-500 mt-1.5">•</span>
            <span className="flex-1 leading-relaxed">{renderSegment(line.replace(/^- /, ''))}</span>
          </div>
        );

        // Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
             return (
                <div key={index} className="flex items-start ml-4 mb-2">
                   <span className="mr-2 text-indigo-500 font-bold">{trimmed.split('.')[0]}.</span>
                   <span className="flex-1 leading-relaxed">{renderSegment(trimmed.replace(/^\d+\.\s/, ''))}</span>
                </div>
            )
        }
        
        // Regular paragraphs
        return <p key={index} className="leading-relaxed text-slate-700 mb-3">{renderSegment(line)}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;