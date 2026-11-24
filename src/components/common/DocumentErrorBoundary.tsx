import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, X, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useDocumentStore } from "@/stores/documentStore";

interface Props {
  documentTitle?: string;
  documentId?: string;
  onReload?: () => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

/**
 * Windows 11 Fluent-inspired Error Boundary that isolates rendering failures
 * in document view panes, preventing a malformed document from crashing the application shell.
 */
export class DocumentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("DocumentErrorBoundary caught rendering error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
    if (this.props.onReload) {
      this.props.onReload();
    }
  };

  handleCloseTab = () => {
    if (this.props.documentId) {
      useDocumentStore.getState().closeDocument(this.props.documentId);
    } else {
      useDocumentStore.getState().closeActiveDocument();
    }
  };

  handleCopyDetails = async () => {
    const details = [
      `Document: ${this.props.documentTitle || "Unknown"}`,
      `ID: ${this.props.documentId || "N/A"}`,
      `Error: ${this.state.error?.message || "Unknown error"}`,
      `Stack: ${this.state.error?.stack || "No stack trace available"}`,
      `Component Stack: ${this.state.errorInfo?.componentStack || "N/A"}`,
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Ignored in non-clipboard environments
    }
  };

  render() {
    if (this.state.hasError) {
      const docName = this.props.documentTitle || "This document";

      return (
        <div
          role="alert"
          aria-label="Document rendering error"
          className="flex-1 flex flex-col items-center justify-center p-6 h-full bg-[var(--fluent-bg-window)] text-[var(--fluent-text-primary)] select-text"
        >
          <div className="max-w-xl w-full p-6 rounded-[var(--fluent-radius-xl)] bg-[var(--fluent-bg-card)] border border-rose-500/30 shadow-[var(--fluent-shadow-flyout)] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-500 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-[var(--fluent-text-primary)]">
                  Unable to Display {docName}
                </h2>
                <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-1 leading-relaxed">
                  An unexpected error occurred while rendering this document. The application shell
                  and your other open tabs remain safe and functional.
                </p>
                {this.state.error && (
                  <div className="mt-2.5 p-2 rounded-[var(--fluent-radius-md)] bg-rose-500/5 border border-rose-500/20 text-[11px] font-mono text-rose-600 dark:text-rose-400 break-words">
                    {this.state.error.message}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--fluent-border-divider)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[var(--fluent-radius-md)] bg-[var(--fluent-accent)] text-white hover:bg-[var(--fluent-accent-hover)] transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleCloseTab}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[var(--fluent-radius-md)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close Tab</span>
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleCopyDetails}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-md)] transition-colors"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Diagnostics</span>
                  </>
                )}
              </button>
            </div>

            {/* Collapsible Technical Diagnostics */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="flex items-center gap-1.5 text-[11px] text-[var(--fluent-text-tertiary)] hover:text-[var(--fluent-text-secondary)] transition-colors"
              >
                {this.state.showDetails ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Technical Diagnostics</span>
              </button>

              {this.state.showDetails && (
                <pre className="mt-2 p-3 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-subtle)] text-[10px] font-mono text-[var(--fluent-text-secondary)] max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                  {this.state.error?.stack || "No call stack captured."}
                  {this.state.errorInfo?.componentStack && `\nComponent stack:${this.state.errorInfo.componentStack}`}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
