import React, { useState, useEffect } from "react";
import { CodeBlock as CodeBlockType, HighlightResult } from "@/types/markdown";
import { Check, Copy } from "lucide-react";
import { MermaidBlock } from "./MermaidBlock";
import { highlightCode } from "@/services/highlightService";
import { useUIStore } from "@/stores/uiStore";

export const CodeBlock: React.FC<{ node: CodeBlockType }> = ({ node }) => {
  const [copied, setCopied] = useState(false);
  const [highlightResult, setHighlightResult] = useState<HighlightResult | null>(null);

  const { theme } = useUIStore();
  const isDark =
    typeof window !== "undefined"
      ? theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      : false;

  const rawLanguage = (node.language || "").trim().toLowerCase();

  // If language is mermaid, delegate to dedicated MermaidBlock
  if (rawLanguage === "mermaid") {
    return <MermaidBlock code={node.code} />;
  }

  useEffect(() => {
    let isMounted = true;

    highlightCode(node.code, node.language, isDark ? "dark" : "light").then((res) => {
      if (isMounted) {
        setHighlightResult(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [node.code, node.language, isDark]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code to clipboard:", err);
    }
  };

  const languageLabel = highlightResult?.language
    ? highlightResult.language.toUpperCase()
    : node.language
    ? node.language.toUpperCase()
    : "PLAIN TEXT";

  return (
    <div className="my-4 rounded-[var(--fluent-radius-lg)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] overflow-hidden shadow-sm">
      {/* Code Header with Language and Copy Button */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[var(--fluent-border-subtle)] bg-[var(--fluent-bg-subtle-hover)] select-none">
        <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--fluent-text-secondary)]">
          {languageLabel}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Code copied" : "Copy code"}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--fluent-radius-sm)] text-[11px] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-active)] transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-normal text-[var(--fluent-text-primary)] select-text">
        <code className="block whitespace-pre">
          {highlightResult ? (
            highlightResult.lines.map((line, lineIdx) => (
              <span key={lineIdx} className="code-line">
                {line.tokens.map((token, tokenIdx) => (
                  <span
                    key={tokenIdx}
                    style={{
                      color: token.color || undefined,
                      fontStyle:
                        token.fontStyle === "italic" || token.fontStyle === "boldItalic"
                          ? "italic"
                          : undefined,
                      fontWeight:
                        token.fontStyle === "bold" || token.fontStyle === "boldItalic"
                          ? "bold"
                          : undefined,
                    }}
                  >
                    {token.content}
                  </span>
                ))}
              </span>
            ))
          ) : (
            node.code
          )}
        </code>
      </pre>
    </div>
  );
};
