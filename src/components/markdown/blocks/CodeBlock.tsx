import React, { useState, useEffect } from "react";
import { CodeBlock as CodeBlockType, HighlightResult } from "@/types/markdown";
import { Check, Copy } from "lucide-react";
import { MermaidBlock } from "./MermaidBlock";
import { highlightCode } from "@/services/highlightService";
import { useUIStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";

export const CodeBlock: React.FC<{ node: CodeBlockType }> = ({ node }) => {
  const [copied, setCopied] = useState(false);
  const [highlightResult, setHighlightResult] = useState<HighlightResult | null>(null);

  const { theme } = useUIStore();
  const { codeBlocks } = useSettingsStore((s) => s.settings);

  // Compute effective highlighting theme
  const isDark =
    typeof window !== "undefined"
      ? theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      : false;

  const effectiveTheme: "light" | "dark" =
    codeBlocks.theme === "dark"
      ? "dark"
      : codeBlocks.theme === "light"
      ? "light"
      : isDark
      ? "dark"
      : "light";

  const rawLanguage = (node.language || "").trim().toLowerCase();

  // If language is mermaid, delegate to dedicated MermaidBlock
  if (rawLanguage === "mermaid") {
    return <MermaidBlock code={node.code} />;
  }

  useEffect(() => {
    let isMounted = true;

    highlightCode(node.code, node.language, effectiveTheme).then((res) => {
      if (isMounted) {
        setHighlightResult(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [node.code, node.language, effectiveTheme]);

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

  const lines = highlightResult
    ? highlightResult.lines
    : node.code.split("\n").map((line) => ({
        tokens: [{ content: line, color: null, fontStyle: null }],
      }));

  return (
    <div className="my-4 rounded-[var(--fluent-radius-lg)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] overflow-hidden shadow-sm">
      {/* Code Header with Language and Copy Button */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[var(--fluent-border-subtle)] bg-[var(--fluent-bg-subtle-hover)] select-none">
        <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--fluent-text-secondary)]">
          {languageLabel}
        </span>

        {codeBlocks.showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Code copied" : "Copy code"}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--fluent-radius-sm)] text-[11px] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-active)] transition-all cursor-pointer"
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
        )}
      </div>

      {/* Code Content */}
      <pre
        className={`p-4 text-[13px] font-mono leading-normal text-[var(--fluent-text-primary)] select-text ${
          codeBlocks.wrapLongLines
            ? "whitespace-pre-wrap break-words overflow-x-hidden"
            : "overflow-x-auto whitespace-pre"
        }`}
      >
        <code className="block">
          {lines.map((line, lineIdx) => (
            <div key={lineIdx} className="flex code-line">
              {codeBlocks.showLineNumbers && (
                <span
                  aria-hidden="true"
                  className="select-none text-right pr-4 text-[var(--fluent-text-disabled)] font-mono min-w-[2.5rem] opacity-60 text-[11px] leading-normal"
                >
                  {lineIdx + 1}
                </span>
              )}
              <span className="flex-1">
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
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};
