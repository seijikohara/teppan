export { CodeEditor, type CodeEditorProps } from "./CodeEditor";
export {
  useEditor,
  type UseEditorOptions,
  type UseEditorReturn,
} from "./useEditor";

// Re-export commonly used types from @teppan/view
export {
  EditorView,
  type EditorViewConfig,
  EditorState,
  type EditorStateConfig,
  Transaction,
  type TransactionSpec,
  type Extension,
  type KeyBinding,
  SelectionSet,
  SelectionRange,
} from "@teppan/view";

// Re-export theme utilities
export {
  type Theme,
  defaultLight,
  defaultDark,
  applyTheme,
  injectBaseStyles,
} from "@teppan/theme";
