import { Extension } from "@codemirror/state";
import { EditorState, Compartment } from "@codemirror/state";
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
import { SourceSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/services/settingsService";

export const lineNumbersCompartment = new Compartment();
export const highlightActiveLineCompartment = new Compartment();
export const lineWrappingCompartment = new Compartment();
export const tabSizeCompartment = new Compartment();
export const typographyCompartment = new Compartment();

export function getTypographyExtension(
  fontSize: number,
  lineHeight: number,
  fontFamily: string
): Extension {
  return EditorView.theme({
    "&": {
      fontSize: `${fontSize}px`,
      fontFamily: fontFamily,
    },
    ".cm-content": {
      lineHeight: `${lineHeight}`,
      fontFamily: fontFamily,
    },
    ".cm-gutters": {
      fontFamily: fontFamily,
      fontSize: `${fontSize}px`,
    },
  });
}

export interface SourceEditorConfig {
  isDark: boolean;
  settings?: SourceSettings;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

/**
 * Creates the complete set of extensions for the read-only CodeMirror Markdown source viewer.
 */
export function createSourceEditorExtensions(config: SourceEditorConfig): Extension[] {
  const sourceSettings = config.settings || DEFAULT_SETTINGS.source;

  const extensions: Extension[] = [
    // Visual layout and line indicators via compartments
    lineNumbersCompartment.of(
      sourceSettings.showLineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : []
    ),
    highlightActiveLineCompartment.of(
      sourceSettings.highlightActiveLine ? highlightActiveLine() : []
    ),
    lineWrappingCompartment.of(
      sourceSettings.wordWrap ? EditorView.lineWrapping : []
    ),
    tabSizeCompartment.of(
      EditorState.tabSize.of(sourceSettings.tabSize)
    ),
    typographyCompartment.of(
      getTypographyExtension(
        sourceSettings.fontSize,
        sourceSettings.lineHeight,
        sourceSettings.fontFamily
      )
    ),

    drawSelection(),

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
