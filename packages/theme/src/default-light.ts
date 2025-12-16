import type { Theme } from "./theme";

/**
 * Default light theme
 * A clean, modern light theme inspired by VS Code and GitHub
 */
export const defaultLight: Theme = {
  name: "default-light",
  type: "light",

  // Base colors
  background: "#ffffff",
  foreground: "#24292f",
  lineHighlight: "#f6f8fa",
  activeLine: "#f0f4f8",
  matchingBracket: "#c8e1ff",

  // Selection
  selection: {
    background: "#add6ff",
    foreground: undefined,
    backgroundUnfocused: "#d0d0d0",
  },

  // Cursor
  cursor: {
    color: "#24292f",
    width: "2px",
    blink: true,
  },

  // Gutter
  gutter: {
    background: "#ffffff",
    foreground: "#6e7781",
    border: "#e1e4e8",
    activeLineNumber: "#24292f",
  },

  // Token styles
  tokens: {
    comment: "#6a737d",
    keyword: "#d73a49",
    string: "#032f62",
    number: "#005cc5",
    operator: "#d73a49",
    function: "#6f42c1",
    variable: "#24292f",
    type: "#6f42c1",
    class: "#6f42c1",
    property: "#005cc5",
    punctuation: "#24292f",
    regexp: "#032f62",
    constant: "#005cc5",
    boolean: "#005cc5",
    null: "#005cc5",
    tag: "#22863a",
    attribute: "#6f42c1",
    namespace: "#6f42c1",
    label: "#6f42c1",
    meta: "#6a737d",
    invalid: "#cb2431",
    deprecated: "#b31d28",
  },
};
