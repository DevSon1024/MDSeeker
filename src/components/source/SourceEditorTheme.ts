import { EditorView } from "@codemirror/view";
import { Compartment, Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const themeCompartment = new Compartment();

/**
 * Fluent Light Theme for CodeMirror 6.
 * Matches MDSeeker Windows 11 Fluent Light tokens.
 */
export const fluentLightHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: "#0067c0", fontWeight: "bold" },
  { tag: tags.heading1, fontSize: "1.25em" },
  { tag: tags.heading2, fontSize: "1.15em" },
  { tag: tags.heading3, fontSize: "1.05em" },
  { tag: tags.strong, fontWeight: "bold", color: "#1b1b1b" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", opacity: 0.75 },
  { tag: tags.link, color: "#0067c0", textDecoration: "underline" },
  { tag: tags.url, color: "#5c5c5c" },
  { tag: tags.monospace, color: "#0067c0", backgroundColor: "rgba(0, 0, 0, 0.04)" },
  { tag: tags.quote, color: "#5c5c5c", fontStyle: "italic" },
  { tag: tags.list, color: "#0067c0" },
  { tag: tags.meta, color: "#8a8a8a" },
  { tag: tags.comment, color: "#8a8a8a", fontStyle: "italic" },
  { tag: tags.keyword, color: "#0067c0", fontWeight: "600" },
  { tag: tags.string, color: "#b35900" },
  { tag: tags.number, color: "#098658" },
  { tag: tags.atom, color: "#795e26" },
]);

export const fluentLightEditorTheme = EditorView.theme(
  {
    "&": {
      color: "#1b1b1b",
      backgroundColor: "#f9f9f9",
      height: "100%",
      fontSize: "13px",
      fontFamily: '"Cascadia Code", "Consolas", monospace',
    },
    ".cm-content": {
      caretColor: "#0067c0",
      lineHeight: "1.65",
      padding: "16px 0",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#0067c0",
      borderLeftWidth: "2px",
    },
    ".cm-gutters": {
      backgroundColor: "#f3f3f3",
      color: "#8a8a8a",
      borderRight: "1px solid rgba(0, 0, 0, 0.07)",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(0, 0, 0, 0.06)",
      color: "#1b1b1b",
      fontWeight: "bold",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(0, 0, 0, 0.025)",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(0, 103, 192, 0.18) !important",
    },
    ".cm-searchMatch": {
      backgroundColor: "rgba(255, 213, 79, 0.45)",
      outline: "1px solid rgba(255, 179, 0, 0.7)",
      borderRadius: "2px",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "rgba(255, 179, 0, 0.8)",
    },
    ".cm-panels": {
      backgroundColor: "#ffffff",
      borderColor: "rgba(0, 0, 0, 0.08)",
      color: "#1b1b1b",
    },
    ".cm-panels input": {
      backgroundColor: "#f9f9f9",
      border: "1px solid rgba(0, 0, 0, 0.12)",
      borderRadius: "4px",
      padding: "4px 8px",
      color: "#1b1b1b",
      outline: "none",
    },
    ".cm-panels button": {
      borderRadius: "4px",
      backgroundColor: "transparent",
      color: "#1b1b1b",
      border: "1px solid rgba(0, 0, 0, 0.1)",
      padding: "2px 8px",
    },
    ".cm-panels button:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
  },
  { dark: false }
);

/**
 * Fluent Dark Theme for CodeMirror 6.
 * Matches MDSeeker Windows 11 Fluent Dark tokens.
 */
export const fluentDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: "#60cdff", fontWeight: "bold" },
  { tag: tags.heading1, fontSize: "1.25em" },
  { tag: tags.heading2, fontSize: "1.15em" },
  { tag: tags.heading3, fontSize: "1.05em" },
  { tag: tags.strong, fontWeight: "bold", color: "#ffffff" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", opacity: 0.75 },
  { tag: tags.link, color: "#60cdff", textDecoration: "underline" },
  { tag: tags.url, color: "#a0a0a0" },
  { tag: tags.monospace, color: "#60cdff", backgroundColor: "rgba(255, 255, 255, 0.06)" },
  { tag: tags.quote, color: "#a0a0a0", fontStyle: "italic" },
  { tag: tags.list, color: "#60cdff" },
  { tag: tags.meta, color: "#757575" },
  { tag: tags.comment, color: "#757575", fontStyle: "italic" },
  { tag: tags.keyword, color: "#60cdff", fontWeight: "600" },
  { tag: tags.string, color: "#ce9178" },
  { tag: tags.number, color: "#b5cea8" },
  { tag: tags.atom, color: "#dcdcaa" },
]);

export const fluentDarkEditorTheme = EditorView.theme(
  {
    "&": {
      color: "#ffffff",
      backgroundColor: "#272727",
      height: "100%",
      fontSize: "13px",
      fontFamily: '"Cascadia Code", "Consolas", monospace',
    },
    ".cm-content": {
      caretColor: "#60cdff",
      lineHeight: "1.65",
      padding: "16px 0",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#60cdff",
      borderLeftWidth: "2px",
    },
    ".cm-gutters": {
      backgroundColor: "#202020",
      color: "#757575",
      borderRight: "1px solid rgba(255, 255, 255, 0.07)",
      paddingRight: "8px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      color: "#ffffff",
      fontWeight: "bold",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(255, 255, 255, 0.04)",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(96, 205, 255, 0.25) !important",
    },
    ".cm-searchMatch": {
      backgroundColor: "rgba(255, 213, 79, 0.35)",
      outline: "1px solid rgba(255, 213, 79, 0.6)",
      borderRadius: "2px",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "rgba(255, 213, 79, 0.7)",
    },
    ".cm-panels": {
      backgroundColor: "#2c2c2c",
      borderColor: "rgba(255, 255, 255, 0.09)",
      color: "#ffffff",
    },
    ".cm-panels input": {
      backgroundColor: "#202020",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: "4px",
      padding: "4px 8px",
      color: "#ffffff",
      outline: "none",
    },
    ".cm-panels button": {
      borderRadius: "4px",
      backgroundColor: "transparent",
      color: "#ffffff",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      padding: "2px 8px",
    },
    ".cm-panels button:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
  },
  { dark: true }
);

/**
 * Returns CodeMirror theme and syntax highlighting extensions for current theme mode.
 */
export function getThemeExtension(isDark: boolean): Extension {
  if (isDark) {
    return [fluentDarkEditorTheme, syntaxHighlighting(fluentDarkHighlightStyle)];
  }
  return [fluentLightEditorTheme, syntaxHighlighting(fluentLightHighlightStyle)];
}
