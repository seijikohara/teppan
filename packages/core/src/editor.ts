import type {
  EditorOptions,
  EditorState,
  EditorEvents,
  Position,
  Selection,
} from "./types";

const DEFAULT_OPTIONS: Required<EditorOptions> = {
  initialContent: "",
  language: "plaintext",
  readOnly: false,
  tabSize: 2,
  lineNumbers: true,
  wordWrap: false,
};

/**
 * Headless code editor core
 *
 * This class provides the core logic for a code editor without any
 * framework-specific rendering. It manages state and emits events
 * that can be consumed by framework-specific wrappers.
 */
export class Editor {
  private options: Required<EditorOptions>;
  private events: EditorEvents;
  private state: EditorState;

  constructor(options: EditorOptions = {}, events: EditorEvents = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.events = events;
    this.state = {
      content: this.options.initialContent,
      cursor: { line: 0, column: 0 },
      selection: null,
      isDirty: false,
      language: this.options.language,
    };
  }

  /**
   * Get the current editor state
   */
  getState(): Readonly<EditorState> {
    return { ...this.state };
  }

  /**
   * Get the current content
   */
  getContent(): string {
    return this.state.content;
  }

  /**
   * Set the content of the editor
   */
  setContent(content: string): void {
    if (this.options.readOnly) return;

    this.state.content = content;
    this.state.isDirty = true;
    this.events.onChange?.(content);
  }

  /**
   * Insert text at the current cursor position
   */
  insertText(text: string): void {
    if (this.options.readOnly) return;

    const lines = this.state.content.split("\n");
    const { line, column } = this.state.cursor;

    if (lines[line] !== undefined) {
      const currentLine = lines[line];
      lines[line] =
        currentLine.slice(0, column) + text + currentLine.slice(column);
    }

    this.state.content = lines.join("\n");
    this.state.cursor.column += text.length;
    this.state.isDirty = true;

    this.events.onChange?.(this.state.content);
    this.events.onCursorChange?.(this.state.cursor);
  }

  /**
   * Delete text at the current cursor position
   */
  deleteText(count: number = 1): void {
    if (this.options.readOnly) return;

    const lines = this.state.content.split("\n");
    const { line, column } = this.state.cursor;

    if (lines[line] !== undefined) {
      const currentLine = lines[line];
      lines[line] =
        currentLine.slice(0, Math.max(0, column - count)) +
        currentLine.slice(column);
      this.state.cursor.column = Math.max(0, column - count);
    }

    this.state.content = lines.join("\n");
    this.state.isDirty = true;

    this.events.onChange?.(this.state.content);
    this.events.onCursorChange?.(this.state.cursor);
  }

  /**
   * Set the cursor position
   */
  setCursor(position: Position): void {
    const lines = this.state.content.split("\n");
    const maxLine = Math.max(0, lines.length - 1);
    const line = Math.max(0, Math.min(position.line, maxLine));
    const maxColumn = lines[line]?.length ?? 0;
    const column = Math.max(0, Math.min(position.column, maxColumn));

    this.state.cursor = { line, column };
    this.events.onCursorChange?.(this.state.cursor);
  }

  /**
   * Set the selection range
   */
  setSelection(selection: Selection | null): void {
    this.state.selection = selection;
    this.events.onSelectionChange?.(selection);
  }

  /**
   * Get the selected text
   */
  getSelectedText(): string {
    if (!this.state.selection) return "";

    const { start, end } = this.state.selection;
    const lines = this.state.content.split("\n");

    if (start.line === end.line) {
      return lines[start.line]?.slice(start.column, end.column) ?? "";
    }

    const selectedLines: string[] = [];
    for (let i = start.line; i <= end.line; i++) {
      const line = lines[i];
      if (line === undefined) continue;

      if (i === start.line) {
        selectedLines.push(line.slice(start.column));
      } else if (i === end.line) {
        selectedLines.push(line.slice(0, end.column));
      } else {
        selectedLines.push(line);
      }
    }

    return selectedLines.join("\n");
  }

  /**
   * Set the language mode
   */
  setLanguage(language: string): void {
    this.state.language = language;
  }

  /**
   * Get the current options
   */
  getOptions(): Readonly<Required<EditorOptions>> {
    return { ...this.options };
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<EditorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Mark the content as saved (not dirty)
   */
  markSaved(): void {
    this.state.isDirty = false;
  }

  /**
   * Get the number of lines
   */
  getLineCount(): number {
    return this.state.content.split("\n").length;
  }

  /**
   * Get a specific line's content
   */
  getLine(lineNumber: number): string | undefined {
    const lines = this.state.content.split("\n");
    return lines[lineNumber];
  }

  /**
   * Handle focus event
   */
  focus(): void {
    this.events.onFocus?.();
  }

  /**
   * Handle blur event
   */
  blur(): void {
    this.events.onBlur?.();
  }

  /**
   * Destroy the editor and clean up
   */
  destroy(): void {
    this.events = {};
  }
}
