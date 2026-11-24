import { describe, it, expect, vi } from "vitest";
import { isSafeUrl } from "./linkSafety";
import { isSafeImageUrl, resolveImageUrl } from "./imageSafety";

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`),
}));

describe("linkSafety", () => {
  it("allows standard safe web protocols and mailto", () => {
    expect(isSafeUrl("https://github.com/DevSon1024/MDSeeker")).toBe(true);
    expect(isSafeUrl("http://localhost:3000")).toBe(true);
    expect(isSafeUrl("mailto:developer@example.com")).toBe(true);
  });

  it("allows internal document anchor links", () => {
    expect(isSafeUrl("#heading-1")).toBe(true);
    expect(isSafeUrl("#installation")).toBe(true);
  });

  it("allows safe relative paths", () => {
    expect(isSafeUrl("./guide.md")).toBe(true);
    expect(isSafeUrl("../docs/architecture.md")).toBe(true);
    expect(isSafeUrl("/images/logo.png")).toBe(true);
  });

  it("strictly blocks dangerous executable schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("JAVASCRIPT:alert(document.cookie)")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("file:///C:/Windows/System32")).toBe(false);
  });
});

describe("imageSafety", () => {
  it("allows safe external image URLs", () => {
    expect(isSafeImageUrl("https://example.com/logo.png")).toBe(true);
    expect(isSafeImageUrl("http://example.com/photo.jpg")).toBe(true);
  });

  it("blocks dangerous image schemes", () => {
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeImageUrl("data:image/svg+xml;base64,PHN2Zw==")).toBe(false);
  });

  it("resolves external images directly", () => {
    expect(resolveImageUrl("https://example.com/pic.png")).toBe("https://example.com/pic.png");
  });

  it("resolves relative paths with spaces, URL-encoding, and query parameters", () => {
    const docPath = "D:/Projects/Nosved-Player/README.md";
    // With spaces
    const resolvedSpace = resolveImageUrl("Screenshots/NosvedPlayer Logo.png", docPath);
    expect(resolvedSpace).toContain("asset://localhost/");
    expect(resolvedSpace).toContain("NosvedPlayer%20Logo.png");

    // With URL encoded space
    const resolvedEncoded = resolveImageUrl("Screenshots/NosvedPlayer%20Logo.png", docPath);
    expect(resolvedEncoded).toContain("asset://localhost/");
    expect(resolvedEncoded).toContain("NosvedPlayer%20Logo.png");

    // With query parameter (query stripped from path)
    const resolvedQuery = resolveImageUrl("Screenshots/Logo.png?raw=true", docPath);
    expect(resolvedQuery).toContain("Logo.png");
    expect(resolvedQuery).not.toContain("raw=true");
  });
});
