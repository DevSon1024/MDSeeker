# MDSeeker

MDSeeker is a lightweight, Windows-first Markdown viewer built using Rust, Tauri 2, and React.

- **Application Identifier**: `com.devson.mdseeker`
- **Product Name**: `MDSeeker`

## Architecture

- **Rust Backend (`src-tauri`)**:
  - Owns file access, document loading, Markdown parsing, syntax highlighting, and Windows integration.
  - Implements typed Tauri commands and strict validation boundaries.
- **React Frontend (`src`)**:
  - Owns the presentation layer, document tabs, reader components, source viewer, and settings.
  - Powered by React 19, TypeScript, Vite, Tailwind CSS, and Zustand.
  - Windows 11 Fluent-inspired design system with Mica and Acrylic styling cues.

## Development

```bash
# Install dependencies
pnpm install

# Run frontend unit tests
pnpm test

# Run Rust unit tests
cargo test --manifest-path src-tauri/Cargo.toml

# Build frontend
pnpm build

# Build Rust backend
cargo build --manifest-path src-tauri/Cargo.toml

# Run application in development mode
pnpm tauri dev
```
