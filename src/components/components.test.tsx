import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useUIStore } from "@/stores/uiStore";
import { TitleBar } from "./window/TitleBar";
import { TabBar } from "./tabs/TabBar";
import { ReaderToolbar } from "./toolbar/ReaderToolbar";
import { OutlineSidebar } from "./sidebar/OutlineSidebar";
import { EmptyWorkspace } from "./workspace/EmptyWorkspace";
import { StatusBar } from "./status/StatusBar";

describe("Phase 02 Fluent UI Components", () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: "system",
      isSidebarOpen: false,
      viewMode: "reading",
      isMaximized: false,
      isSearchOpen: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("TitleBar and WindowControls", () => {
    it("renders title bar with branding and window control buttons", () => {
      render(<TitleBar />);
      expect(screen.getByText("MDSeeker")).toBeDefined();
      expect(screen.getByLabelText("Minimize")).toBeDefined();
      expect(screen.getByLabelText("Maximize")).toBeDefined();
      expect(screen.getByLabelText("Close")).toBeDefined();
    });
  });

  describe("TabBar", () => {
    it("renders welcome tab and new tab button", () => {
      render(<TabBar />);
      expect(screen.getByText("Welcome")).toBeDefined();
      expect(screen.getByLabelText("New document tab")).toBeDefined();
    });
  });

  describe("ReaderToolbar", () => {
    it("renders sidebar toggle and updates store on click", () => {
      render(<ReaderToolbar />);
      const sidebarToggle = screen.getByLabelText("Show Outline Sidebar");
      fireEvent.click(sidebarToggle);
      expect(useUIStore.getState().isSidebarOpen).toBe(true);
    });

    it("switches view modes on button click", () => {
      render(<ReaderToolbar />);
      const sourceBtn = screen.getByLabelText("Source mode");
      fireEvent.click(sourceBtn);
      expect(useUIStore.getState().viewMode).toBe("source");

      const splitBtn = screen.getByLabelText("Split mode");
      fireEvent.click(splitBtn);
      expect(useUIStore.getState().viewMode).toBe("split");
    });
  });

  describe("OutlineSidebar", () => {
    it("renders empty outline placeholder", () => {
      useUIStore.setState({ isSidebarOpen: true });
      render(<OutlineSidebar />);
      expect(screen.getByText("Outline")).toBeDefined();
      expect(screen.getByText("No Outline Available")).toBeDefined();
    });
  });

  describe("EmptyWorkspace", () => {
    it("renders MDSeeker logo, heading, and open button with placeholder notification", () => {
      render(<EmptyWorkspace />);
      expect(screen.getByRole("heading", { name: "MDSeeker" })).toBeDefined();
      expect(screen.getByText(".md")).toBeDefined();
      expect(screen.getByText(".markdown")).toBeDefined();

      const openBtn = screen.getByRole("button", { name: /Open Markdown File/i });
      fireEvent.click(openBtn);
      expect(screen.getByText(/Document loading will be enabled in Phase 03/i)).toBeDefined();
    });
  });

  describe("StatusBar", () => {
    it("renders placeholder document status and active view mode", () => {
      render(<StatusBar />);
      expect(screen.getByText("No document loaded")).toBeDefined();
      expect(screen.getByText("Reading Mode")).toBeDefined();
      expect(screen.getByText("UTF-8")).toBeDefined();
    });
  });
});
