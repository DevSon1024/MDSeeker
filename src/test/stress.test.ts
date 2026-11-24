import { describe, it, expect, beforeEach } from "vitest";
import { extractOutline } from "@/components/sidebar/outlineUtils";
import { highlightCode, clearHighlightCache, getHighlightCacheSize } from "@/services/highlightService";
import { useDocumentStore } from "@/stores/documentStore";
import { MarkdownDocument, BlockNode } from "@/types/markdown";
import { LoadedDocument } from "@/types/document";

describe("Stress & Reliability Suite", () => {
  beforeEach(() => {
    clearHighlightCache();
  });

  it("handles extraction of outlines on documents with 500 headings rapidly", () => {
    const blocks: BlockNode[] = [];
    for (let i = 1; i <= 500; i++) {
      const level = ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        type: "heading",
        level,
        id: `heading-${i}`,
        content: [{ type: "text", value: `Section ${i} with extra details and words` }],
      });
      // Add interspaced paragraph blocks
      blocks.push({
        type: "paragraph",
        content: [{ type: "text", value: `Body content for section ${i}...` }],
      });
    }

    const doc: MarkdownDocument = {
      blocks,
      metadata: {
        title: "Massive Document",
        wordCount: 15000,
        characterCount: 90000,
        readingTimeMinutes: 60,
        frontmatter: null,
        hasTables: false,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 500,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    const startTime = performance.now();
    const outline = extractOutline(doc);
    const duration = performance.now() - startTime;

    expect(outline.length).toBe(500);
    expect(outline[0].text).toBe("Section 1 with extra details and words");
    expect(outline[499].id).toBe("heading-500");
    // Should complete in well under 100ms in JavaScript
    expect(duration).toBeLessThan(150);
  });

  it("manages memory by evicting highlight cache entries when exceeding 500 blocks", async () => {
    clearHighlightCache();
    expect(getHighlightCacheSize()).toBe(0);

    // Request highlighting for 550 distinct code blocks
    // In Happy-DOM test environment, invoke fallback generates plain text tokens
    for (let i = 0; i < 550; i++) {
      await highlightCode(`const variable_${i} = ${i};`, "typescript", "dark");
    }

    // Cache must never balloon indefinitely; must stay <= 500
    const cacheSize = getHighlightCacheSize();
    expect(cacheSize).toBeLessThanOrEqual(500);
    expect(cacheSize).toBeGreaterThan(400);

    // Cache clearing restores memory to zero
    clearHighlightCache();
    expect(getHighlightCacheSize()).toBe(0);
  });

  it("sustains 50 open documents with rapid tab switching and reordering", () => {
    const docs: LoadedDocument[] = [];
    for (let i = 1; i <= 50; i++) {
      docs.push({
        canonicalPath: `C:/docs/file_${i}.md`,
        fileName: `file_${i}.md`,
        fileExtension: "md",
        fileSizeBytes: 1024 * i,
        lastModifiedTimestamp: 1700000000000 + i * 1000,
        rawContent: `# File ${i}\n\nContent for file ${i}.`,
      });
    }

    useDocumentStore.setState({
      documents: docs.map((d) => ({
        id: d.canonicalPath,
        canonicalPath: d.canonicalPath,
        fileName: d.fileName,
        fileExtension: d.fileExtension,
        fileSizeBytes: d.fileSizeBytes,
        lastModifiedTimestamp: d.lastModifiedTimestamp,
        rawContent: d.rawContent,
        parsedDocument: null,
        isLoading: false,
        isParsing: false,
        error: null,
        parseError: null,
        lastAccessedAt: Date.now(),
        readerScrollPosition: 0,
        sourceScrollPosition: 0,
      })),
      activeDocumentId: docs[0].canonicalPath,
      document: docs[0],
      parsedDocument: null,
    });

    const store = useDocumentStore.getState();
    expect(store.documents.length).toBe(50);

    // Rapidly switch through 50 tabs
    for (let i = 0; i < 50; i++) {
      store.activateNextTab();
    }
    // Cycled full circle back to first
    expect(useDocumentStore.getState().activeDocumentId).toBe(docs[0].canonicalPath);

    // Rapidly reorder tabs
    store.reorderDocuments(0, 49);
    expect(useDocumentStore.getState().documents[49].fileName).toBe("file_1.md");
    expect(useDocumentStore.getState().documents[0].fileName).toBe("file_2.md");

    // Close 25 documents from the right
    store.closeTabsToTheRight("file_26.md"); // Note: doc id is canonicalPath
    store.closeOtherDocuments(docs[1].canonicalPath);
    expect(useDocumentStore.getState().documents.length).toBe(1);
    expect(useDocumentStore.getState().activeDocumentId).toBe(docs[1].canonicalPath);

    store.closeAllDocuments();
    expect(useDocumentStore.getState().documents.length).toBe(0);
    expect(useDocumentStore.getState().activeDocumentId).toBeNull();
  });
});
