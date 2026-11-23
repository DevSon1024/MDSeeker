import React, { useState } from "react";
import { CodeBlock as CodeBlockType } from "@/types/markdown";
import { Check, Copy } from "lucide-react";

export const CodeBlock: React.FC<{ node: CodeBlockType }> = ({ node }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code to clipboard:", err);
    }
  };

  const languageLabel = node.language ? node.language.toUpperCase() : "PLAIN TEXT";

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
        <code className="block whitespace-pre">{node.code}</code>
      </pre>
    </div>
  );
};
