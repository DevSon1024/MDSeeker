import React from "react";
import { AlertCircle } from "lucide-react";

interface MathErrorFallbackProps {
  math: string;
  error?: string;
  isInline?: boolean;
}

export const MathErrorFallback: React.FC<MathErrorFallbackProps> = ({
  math,
  error,
  isInline,
}) => {
  if (isInline) {
    return (
      <span
        role="alert"
        title={error ? `Math syntax error: ${error}` : "Invalid LaTeX expression"}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-[var(--fluent-radius-xs)] font-mono text-[11px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 select-text"
      >
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span>${math}$</span>
      </span>
    );
  }

  return (
    <div
      role="alert"
      className="my-3 p-3 rounded-[var(--fluent-radius-md)] border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-mono select-text"
    >
      <div className="flex items-center gap-1.5 font-sans font-medium mb-1">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Math Expression Error</span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap p-2 rounded bg-black/5 dark:bg-white/5">
        $${math}$$
      </pre>
      {error && <p className="text-[11px] mt-1 opacity-80">{error}</p>}
    </div>
  );
};
