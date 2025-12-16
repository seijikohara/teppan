import type { Theme } from "./theme";

/**
 * Default dark theme
 * A clean, modern dark theme inspired by VS Code and GitHub Dark
 */
export const defaultDark: Theme = {
  name: "default-dark",
  type: "dark",

  // Base colors
  background: "#0d1117",
  foreground: "#c9d1d9",
  lineHighlight: "#161b22",
  activeLine: "#1c2128",
  matchingBracket: "#3b5070",

  // Selection
  selection: {
    background: "#264f78",
    foreground: undefined,
    backgroundUnfocused: "#3a3d41",
  },

  // Cursor
  cursor: {
    color: "#c9d1d9",
    width: "2px",
    blink: true,
  },

  // Gutter
  gutter: {
    background: "#0d1117",
    foreground: "#6e7681",
    border: "#30363d",
    activeLineNumber: "#c9d1d9",
  },

  // Token styles
  tokens: {
    comment: "#8b949e",
    keyword: "#ff7b72",
    string: "#a5d6ff",
    number: "#79c0ff",
    operator: "#ff7b72",
    function: "#d2a8ff",
    variable: "#c9d1d9",
    type: "#d2a8ff",
    class: "#d2a8ff",
    property: "#79c0ff",
    punctuation: "#c9d1d9",
    regexp: "#a5d6ff",
    constant: "#79c0ff",
    boolean: "#79c0ff",
    null: "#79c0ff",
    tag: "#7ee787",
    attribute: "#d2a8ff",
    namespace: "#d2a8ff",
    label: "#d2a8ff",
    meta: "#8b949e",
    invalid: "#f85149",
    deprecated: "#ffa657",
  },
};
