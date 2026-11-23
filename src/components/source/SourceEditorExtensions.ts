import { Extension } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  keymap,
} from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { search, searchKeymap } from "@codemirror/search";
import { defaultKeymap } from "@codemirror/commands";
import { getThemeExtension, themeCompartment } from "./SourceEditorTheme";

export interface SourceEditorConfig {
  isDark: boolean;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

/**
 * Creates the complete set of extensions for the read-only CodeMirror Markdown source viewer.
 */
export function createSourceEditorExtensions(config: SourceEditorConfig): Extension[] {
  const extensions: Extension[] = [
    // Visual layout and line indicators
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    EditorView.lineWrapping,

    // Strict read-only enforcement
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),

    // Markdown language support
    markdown(),

    // In-editor Search
    search({ top: true }),

    // Standard keyboard shortcuts & search shortcuts
    keymap.of([...defaultKeymap, ...searchKeymap]),

    // Dynamic Theme Compartment
    themeCompartment.of(getThemeExtension(config.isDark)),
  ];

  // Optional scroll listener
  if (config.onScroll) {
    const scrollHandler = config.onScroll;
    extensions.push(
      EditorView.domEventHandlers({
        scroll(event) {
          const target = event.target as HTMLElement;
          if (target && target.classList.contains("cm-scroller")) {
            scrollHandler(target.scrollTop, target.scrollHeight, target.clientHeight);
          }
        },
      })
    );
  }

  return extensions;
}
