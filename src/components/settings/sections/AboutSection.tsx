import React from "react";
import { Layers, ShieldCheck, Heart } from "lucide-react";

export const AboutSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--fluent-border-divider)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--fluent-text-primary)]">About MDSeeker</h2>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Application identity, architecture, and technology stack.
          </p>
        </div>
      </div>

      {/* App Identity Banner */}
      <div className="p-5 rounded-[var(--fluent-radius-lg)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] shadow-xs flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-white border border-[var(--fluent-border-card)] shadow-md flex items-center justify-center flex-shrink-0 p-2 overflow-hidden select-none">
          <img src="/icon.svg" alt="MDSeeker Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[var(--fluent-text-primary)]">MDSeeker</h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[var(--fluent-accent-subtle)] text-[var(--fluent-accent)]">
              v0.1.1
            </span>
          </div>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Lightweight, blazing-fast, Windows-first Markdown viewer.
          </p>
          <p className="text-[10px] font-mono text-[var(--fluent-text-tertiary)] mt-1">
            Application ID: com.devson.mdseeker
          </p>
        </div>
      </div>

      {/* Description & Windows 11 Fluent Statement */}
      <div className="text-[12px] text-[var(--fluent-text-secondary)] leading-relaxed space-y-2">
        <p>
          MDSeeker is engineered with a strict boundary between Rust and React. All file loading, path
          canonicalization, security sanitization, and Markdown AST parsing are executed natively in Rust via
          Tauri 2, while React 19 powers the responsive Windows 11 Fluent-inspired reading interface.
        </p>
        <p>
          Designed for performance and comfort, featuring Mica-inspired backdrops, Acrylic translucent layers,
          Segoe UI Variable typography, multi-document tabs, and full CommonMark/GFM support.
        </p>
      </div>

      {/* Tech Stack Matrix */}
      <div>
        <h4 className="text-[12px] font-semibold text-[var(--fluent-text-primary)] mb-2.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[var(--fluent-accent)]" />
          <span>Technology Stack</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { name: "Tauri 2", desc: "Native Windows Desktop Framework" },
            { name: "Rust 2021", desc: "File I/O, Parsing & Security" },
            { name: "React 19", desc: "Presentation & User Interface" },
            { name: "pulldown-cmark", desc: "CommonMark / GFM Parser" },
            { name: "syntect", desc: "Syntax Highlighting Engine" },
            { name: "CodeMirror 6", desc: "Read-only Source Inspector" },
            { name: "Mermaid", desc: "Client-side Diagram Engine" },
            { name: "KaTeX", desc: "Math Formula Typesetting" },
            { name: "Tailwind CSS", desc: "Fluent Design Tokens" },
          ].map((item) => (
            <div
              key={item.name}
              className="p-2.5 rounded-[var(--fluent-radius-md)] border border-[var(--fluent-border-subtle)] bg-[var(--fluent-bg-card)] shadow-2xs"
            >
              <div className="text-[11px] font-semibold text-[var(--fluent-text-primary)]">
                {item.name}
              </div>
              <div className="text-[10px] text-[var(--fluent-text-secondary)] mt-0.5 truncate">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-[var(--fluent-border-divider)] flex items-center justify-between text-[11px] text-[var(--fluent-text-tertiary)]">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local execution only · No cloud telemetry</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          <span>by Devson</span>
        </div>
      </div>
    </div>
  );
};
