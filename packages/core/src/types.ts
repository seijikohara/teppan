/**
 * Editor configuration options
 */
export interface EditorOptions {
  /** Initial content of the editor */
  initialContent?: string;
  /** Language mode for syntax highlighting */
  language?: string;
  /** Enable read-only mode */
  readOnly?: boolean;
  /** Tab size in spaces */
  tabSize?: number;
  /** Enable line numbers */
  lineNumbers?: boolean;
  /** Enable word wrap */
  wordWrap?: boolean;
}

/**
 * Represents a position in the editor
 */
export interface Position {
  /** Line number (0-indexed) */
  line: number;
  /** Column number (0-indexed) */
  column: number;
}

/**
 * Represents a selection range in the editor
 */
export interface Selection {
  /** Start position of the selection */
  start: Position;
  /** End position of the selection */
  end: Position;
}

/**
 * Current state of the editor
 */
export interface EditorState {
  /** Current content of the editor */
  content: string;
  /** Current cursor position */
  cursor: Position;
  /** Current selection (null if no selection) */
  selection: Selection | null;
  /** Whether the content has been modified */
  isDirty: boolean;
  /** Current language mode */
  language: string;
}

/**
 * Editor event handlers
 */
export interface EditorEvents {
  /** Called when content changes */
  onChange?: (content: string) => void;
  /** Called when cursor position changes */
  onCursorChange?: (position: Position) => void;
  /** Called when selection changes */
  onSelectionChange?: (selection: Selection | null) => void;
  /** Called when the editor gains focus */
  onFocus?: () => void;
  /** Called when the editor loses focus */
  onBlur?: () => void;
}
