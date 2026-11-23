import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "@/store/appStore";
import { AppInfo } from "@/types";
import {
  FileText,
  CheckCircle2,
  Cpu,
  Layers,
  Terminal,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function App() {
  const { appInfo, setAppInfo, viewMode, setViewMode } = useAppStore();
  const [pingResponse, setPingResponse] = useState<string>("");
  const [customMsg, setCustomMsg] = useState<string>("Hello from MDSeeker UI");
  const [ipcStatus, setIpcStatus] = useState<"checking" | "connected" | "error">("checking");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadInfo() {
      try {
        const info = await invoke<AppInfo>("get_app_info");
        setAppInfo(info);
        const pong = await invoke<string>("ping", { message: "Initial Handshake" });
        setPingResponse(pong);
        setIpcStatus("connected");
      } catch (err) {
        console.error("Tauri IPC check failed:", err);
        setIpcStatus("error");
      }
    }
    loadInfo();
  }, [setAppInfo]);

  const handlePing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await invoke<string>("ping", { message: customMsg });
      setPingResponse(response);
      setIpcStatus("connected");
    } catch (err) {
      console.error("Ping error:", err);
      setIpcStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--fluent-bg-mica)] text-[var(--fluent-text-primary)] select-none">
      {/* Fluent Titlebar Header */}
      <header className="h-10 border-b border-[var(--fluent-border-card)] px-4 flex items-center justify-between bg-[var(--fluent-bg-card)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-500" />
          <span className="text-xs font-semibold tracking-wide">MDSeeker</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium">
            v{appInfo?.version ?? "0.1.0"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              ipcStatus === "connected"
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : ipcStatus === "checking"
                ? "bg-amber-500 animate-pulse"
                : "bg-rose-500"
            }`}
          />
          <span className="text-[11px] text-[var(--fluent-text-secondary)]">
            {ipcStatus === "connected"
              ? "Rust IPC Connected"
              : ipcStatus === "checking"
              ? "Connecting..."
              : "IPC Disconnected"}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-6">
        {/* Hero Card */}
        <div className="w-full bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] rounded-xl p-6 shadow-sm backdrop-blur-md text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 mb-1">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MDSeeker</h1>
          <p className="text-sm text-[var(--fluent-text-secondary)] max-w-lg mx-auto">
            Lightweight, Windows-first Markdown viewer built with Rust, Tauri 2, and React.
          </p>

          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Phase 1: Project Initialization Ready
            </span>
          </div>
        </div>

        {/* System Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] rounded-xl p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-orange-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--fluent-text-secondary)]">
                Rust Backend
              </h2>
            </div>
            <div className="space-y-1 text-xs">
              <p><span className="font-semibold">Tauri:</span> 2.x</p>
              <p><span className="font-semibold">Identifier:</span> {appInfo?.identifier ?? "com.devson.mdseeker"}</p>
              <p><span className="font-semibold">Platform:</span> {appInfo?.platform ?? "windows"}</p>
            </div>
          </div>

          <div className="bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] rounded-xl p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--fluent-text-secondary)]">
                React Frontend
              </h2>
            </div>
            <div className="space-y-1 text-xs">
              <p><span className="font-semibold">UI Engine:</span> React 19 + Vite</p>
              <p><span className="font-semibold">Styling:</span> Tailwind CSS</p>
              <p><span className="font-semibold">State:</span> Zustand Store</p>
            </div>
          </div>

          <div className="bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] rounded-xl p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--fluent-text-secondary)]">
                View Modes
              </h2>
            </div>
            <div className="flex gap-1.5 mt-2">
              {(["reading", "source", "split"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`text-xs capitalize px-2.5 py-1 rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-sky-600 text-white font-medium"
                      : "bg-[var(--fluent-surface-hover)] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tauri IPC Diagnostic Card */}
        <div className="w-full bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] rounded-xl p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--fluent-text-secondary)]">
                Tauri IPC Verification
              </span>
            </div>
            <span className="text-[11px] text-[var(--fluent-text-secondary)] font-mono">
              Command: ping
            </span>
          </div>

          <form onSubmit={handlePing} className="flex gap-2 mb-3">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="Message to send to Rust..."
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-[var(--fluent-surface-hover)] border border-[var(--fluent-border-card)] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Send to Rust
            </button>
          </form>

          {pingResponse && (
            <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-[var(--fluent-border-card)] font-mono text-xs text-emerald-600 dark:text-emerald-400">
              {pingResponse}
            </div>
          )}
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-7 border-t border-[var(--fluent-border-card)] px-4 flex items-center justify-between bg-[var(--fluent-bg-card)] text-[11px] text-[var(--fluent-text-secondary)]">
        <div>Ready</div>
        <div>Mode: {viewMode}</div>
      </footer>
    </div>
  );
}
