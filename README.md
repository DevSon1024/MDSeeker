# MDSeeker

[![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)](https://github.com/devson/mdseeker)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078d4.svg)](https://microsoft.com/windows)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**MDSeeker** is a blazing-fast, lightweight, Windows-first Markdown viewer engineered with **Rust**, **Tauri 2**, and **React 19**. It delivers a clean Windows 11 Fluent-inspired reading environment with multi-document tabs, syntax highlighting, Mermaid diagram rendering, KaTeX mathematical typesetting, and dual-pane split inspection.

---

## Features

- **Blazing Fast Performance**: Rust backend parsing via `pulldown-cmark` streams a structured AST to the frontend with zero UI freezing.
- **Windows 11 Fluent Design**: Native aesthetics featuring Mica-inspired backgrounds, Acrylic translucent layers, Segoe UI Variable typography, and dark/light/system theme adaptation.
- **Three Viewing Modes**:
  - **Reading Mode**: Refined presentation view for distraction-free reading.
  - **Source Inspection Mode**: Read-only CodeMirror 6 inspection with line numbers, code folding, and search.
  - **Split View**: Synchronized dual-pane reading and source inspection with synchronized scrolling and draggable divider.
- **Multi-Document Tabs**: Open multiple Markdown files simultaneously with tab switching, drag reordering, duplicate detection, and tab closure shortcuts.
- **Syntax Highlighting**: Multi-language code syntax highlighting powered by Rust's `syntect` engine with dark/light theme switching.
- **Mermaid Diagrams**: In-line rendering of flowcharts, sequence diagrams, state diagrams, class diagrams, and Git graphs.
- **KaTeX Mathematical Typesetting**: Full LaTeX equation support for inline (`$...$`) and block (`$$...$$`) math formulas.
- **Outline Sidebar**: Collapsible table-of-contents navigation with real-time scroll tracking.
- **Windows Integration**:
  - File associations for `.md` and `.markdown` files.
  - Windows "Open With" integration.
  - Single-instance forwarding (double-clicking files opens them in tabs in the active window).
  - Reveal in File Explorer (`Ctrl+Shift+O`).
- **Customizable Preferences**: Adjust reader line height, font size, content width, CodeMirror typography, and syntax highlight themes.

---

## Supported File Formats

- `.md` (Standard Markdown / CommonMark / GitHub Flavored Markdown)
- `.markdown` (Extended Markdown)

---

## System Requirements

- **Operating System**: Windows 11 or Windows 10 (version 1809 or higher, 64-bit x64).
- **Runtime**: Microsoft Edge WebView2 Runtime (pre-installed on Windows 11 and modern Windows 10).

---

## Installation

### Installer (Recommended)
1. Download the latest `MDSeeker_0.1.1_x64-setup.exe` from the [Releases](https://github.com/devson/mdseeker/releases) page.
2. Run the setup wizard. MDSeeker installs to your user profile (`%LOCALAPPDATA%\Programs\MDSeeker`) without requiring administrator privileges.
3. Launch MDSeeker from your Start menu or desktop shortcut.

### File Association Setup
To set MDSeeker as your default Markdown viewer:
1. Right-click any `.md` file in Windows File Explorer.
2. Select **Open with** -> **Choose another app**.
3. Select **MDSeeker** and check **Always use this app to open .md files**.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open Markdown File Dialog |
| `Ctrl+W` | Close Active Document Tab |
| `Ctrl+Shift+W` | Close All Document Tabs |
| `Ctrl+Tab` | Next Document Tab |
| `Ctrl+Shift+Tab` | Previous Document Tab |
| `Ctrl+1` – `Ctrl+9` | Switch to Tab 1–9 |
| `Ctrl+B` | Toggle Outline Sidebar |
| `Ctrl+,` | Open Application Settings |
| `Ctrl+Shift+O` | Reveal Active File in File Explorer |

---

## Technology Stack

- **Backend**: Rust 2021, Tauri 2, `pulldown-cmark`, `syntect`, `tauri-plugin-single-instance`, `tauri-plugin-dialog`, `tauri-plugin-opener`
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Zustand
- **Components**: CodeMirror 6, Mermaid, KaTeX, Lucide Icons, DOMPurify
- **Packaging**: NSIS Windows Installer

---

## Building from Source

### Prerequisites
- Node.js 20+ and `pnpm` 9+
- Rust 1.77+ with the `x86_64-pc-windows-msvc` target
- Microsoft Visual Studio C++ Build Tools with Windows SDK

### Build Commands
```bash
# Clone the repository
git clone https://github.com/devson/mdseeker.git
cd mdseeker

# Install dependencies
pnpm install

# Run frontend tests
pnpm test

# Run backend Rust tests
cargo test --manifest-path src-tauri/Cargo.toml

# Build frontend bundle
pnpm build

# Compile release package and NSIS installer
pnpm tauri build --bundles nsis
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
