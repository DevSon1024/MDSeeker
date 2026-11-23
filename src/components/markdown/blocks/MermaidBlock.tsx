import React, { useEffect, useState, useId } from "react";
import mermaid from "mermaid";
import DOMPurify from "dompurify";
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

interface MermaidBlockProps {
  code: string;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const { theme } = useUIStore();
  const isDark =
    typeof window !== "undefined"
      ? theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      : false;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const renderDiagram = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "default",
          fontFamily: "var(--fluent-font-family, Segoe UI Variable, sans-serif)",
        });

        // mermaid.render needs a clean DOM element id
        const { svg } = await mermaid.render(diagramId, code.trim());

        if (!isMounted) return;

        // Strict SVG sanitization with DOMPurify
        const cleanSvg = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: ["style"],
        });

        setSvgHtml(cleanSvg);
        setError(null);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setSvgHtml(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code, isDark, diagramId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignored
    }
  };

  if (isLoading && !svgHtml && !error) {
    return (
      <div className="my-4 p-6 rounded-[var(--fluent-radius-lg)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] flex items-center justify-center text-[12px] text-[var(--fluent-text-tertiary)] select-none">
        Rendering diagram...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        aria-label="Mermaid diagram error"
        className="my-4 rounded-[var(--fluent-radius-lg)] border border-rose-500/30 bg-rose-500/5 p-4 text-[12px] text-[var(--fluent-text-primary)] select-text"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Diagram rendering failed</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSource(!showSource)}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)]"
          >
            {showSource ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>{showSource ? "Hide source" : "Show source"}</span>
          </button>
        </div>

        <p className="mt-1 text-[11px] text-[var(--fluent-text-secondary)] break-words">
          {error}
        </p>

        {showSource && (
          <div className="mt-3 pt-3 border-t border-rose-500/20">
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Mermaid code copied" : "Copy Mermaid code"}
                className="inline-flex items-center gap-1 text-[10.5px] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-3 rounded-[var(--fluent-radius-sm)] bg-[var(--fluent-bg-subtle-hover)] font-mono text-[11.5px] overflow-x-auto whitespace-pre">
              {code}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="figure"
      aria-label="Mermaid diagram"
      className="my-4 p-4 rounded-[var(--fluent-radius-lg)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] overflow-x-auto flex justify-center shadow-sm select-none"
    >
      <div
        className="mermaid-svg-container max-w-full overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svgHtml || "" }}
      />
    </div>
  );
};
