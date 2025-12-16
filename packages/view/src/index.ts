// Main view export
export { EditorView, type EditorViewConfig } from "./view";

// Viewport management
export {
  ViewportManager,
  type Viewport,
  type ViewportConfig,
  getVisibleLines,
} from "./viewport";

// Decoration system
export {
  DecorationSet,
  DecorationBuilder,
  collectDecorations,
  lineDecoration,
  rangeDecoration,
  widgetDecoration,
  builder as decorationBuilder,
} from "./decoration";

// Input handling
export {
  InputHandler,
  defaultKeymap,
  normalizeKeyEvent,
  matchKeyBinding,
  IS_MAC,
} from "./input";

// DOM utilities
export {
  CSS,
  createElement,
  createTextNode,
  clearElement,
  setStyles,
  getBoundingRect,
  isInViewport,
  scrollIntoView,
  measureCharSize,
  createEditorDOM,
} from "./dom";

// Search panel
export {
  SearchPanel,
  SearchCSS,
  type SearchPanelConfig,
  type SearchPanelState,
  createSearchPanelState,
  getSearchPanelStyles,
} from "./search-panel";

// Re-export commonly used types from @teppan/state for convenience
export {
  EditorState,
  type EditorStateConfig,
  Transaction,
  type TransactionSpec,
  type Extension,
  type StateField,
  type StateEffect,
  type KeyBinding,
  type Decoration,
  type DecorationProvider,
  SelectionSet,
  SelectionRange,
  ChangeSet,
  Change,
  type Position,
  type Range,
  createPosition,
  createRange,
} from "@teppan/state";
