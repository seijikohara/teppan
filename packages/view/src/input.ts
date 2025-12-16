import {
  type EditorState,
  type KeyBinding,
  SelectionSet,
  type Transaction,
} from "@teppan/state";

/**
 * Platform detection
 */
export const IS_MAC =
  typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

/**
 * Normalize key event to a standard format
 */
export function normalizeKeyEvent(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey && !IS_MAC) parts.push("Ctrl");
  if (event.metaKey && IS_MAC) parts.push("Cmd");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");

  const key = normalizeKey(event.key);
  if (key && !["Control", "Meta", "Alt", "Shift"].includes(key)) {
    parts.push(key);
  }

  return parts.join("-");
}

/**
 * Normalize key names
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    " ": "Space",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Escape: "Esc",
  };
  return keyMap[key] ?? key;
}

/**
 * Check if a key binding matches an event
 */
export function matchKeyBinding(
  binding: KeyBinding,
  normalizedKey: string,
): boolean {
  // Check mac-specific binding first
  if (IS_MAC && binding.mac) {
    return normalizeBindingKey(binding.mac) === normalizedKey;
  }
  return normalizeBindingKey(binding.key) === normalizedKey;
}

/**
 * Normalize a binding key string
 */
function normalizeBindingKey(key: string): string {
  return key
    .split("-")
    .map((part) => {
      if (part === "Mod") return IS_MAC ? "Cmd" : "Ctrl";
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .sort((a, b) => {
      const order = ["Ctrl", "Cmd", "Alt", "Shift"];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .join("-");
}

/**
 * Input handler for the editor
 */
export class InputHandler {
  private composing = false;
  private readonly keydownHandler: (event: KeyboardEvent) => void;
  private readonly keyupHandler: (event: KeyboardEvent) => void;
  private readonly compositionStartHandler: () => void;
  private readonly compositionEndHandler: (event: CompositionEvent) => void;
  private readonly beforeInputHandler: (event: InputEvent) => void;

  constructor(
    private readonly element: HTMLElement,
    private readonly getState: () => EditorState,
    private readonly dispatch: (transaction: Transaction) => void,
  ) {
    this.keydownHandler = this.handleKeyDown.bind(this);
    this.keyupHandler = this.handleKeyUp.bind(this);
    this.compositionStartHandler = this.handleCompositionStart.bind(this);
    this.compositionEndHandler = this.handleCompositionEnd.bind(this);
    this.beforeInputHandler = this.handleBeforeInput.bind(this);
  }

  /**
   * Start listening for input events
   */
  attach(): void {
    this.element.addEventListener("keydown", this.keydownHandler);
    this.element.addEventListener("keyup", this.keyupHandler);
    this.element.addEventListener(
      "compositionstart",
      this.compositionStartHandler,
    );
    this.element.addEventListener("compositionend", this.compositionEndHandler);
    this.element.addEventListener("beforeinput", this.beforeInputHandler);
  }

  /**
   * Stop listening for input events
   */
  detach(): void {
    this.element.removeEventListener("keydown", this.keydownHandler);
    this.element.removeEventListener("keyup", this.keyupHandler);
    this.element.removeEventListener(
      "compositionstart",
      this.compositionStartHandler,
    );
    this.element.removeEventListener(
      "compositionend",
      this.compositionEndHandler,
    );
    this.element.removeEventListener("beforeinput", this.beforeInputHandler);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.composing) return;

    // Ignore events from search panel or other inputs
    if (this.isEventFromOverlay(event)) return;

    const state = this.getState();
    const normalizedKey = normalizeKeyEvent(event);

    // Try to match a key binding
    for (const binding of state.keymap) {
      if (matchKeyBinding(binding, normalizedKey)) {
        const transaction = binding.run(state);
        if (transaction) {
          if (binding.preventDefault !== false) {
            event.preventDefault();
          }
          this.dispatch(transaction);
          return;
        }
      }
    }

    // Handle basic text input for printable characters
    if (this.isPrintableKey(event) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.insertText(event.key);
    }
  }

  private handleKeyUp(_event: KeyboardEvent): void {
    // Reserved for future use
  }

  private handleCompositionStart(): void {
    this.composing = true;
  }

  private handleCompositionEnd(event: CompositionEvent): void {
    this.composing = false;
    if (event.data) {
      this.insertText(event.data);
    }
  }

  private handleBeforeInput(event: InputEvent): void {
    if (this.composing) return;

    // Ignore events from search panel or other inputs
    if (this.isEventFromOverlay(event)) return;

    const inputType = event.inputType;

    switch (inputType) {
      case "insertText":
        if (event.data) {
          event.preventDefault();
          this.insertText(event.data);
        }
        break;

      case "insertLineBreak":
      case "insertParagraph":
        event.preventDefault();
        this.insertText("\n");
        break;

      case "deleteContentBackward":
        event.preventDefault();
        this.deleteBackward();
        break;

      case "deleteContentForward":
        event.preventDefault();
        this.deleteForward();
        break;

      case "insertFromPaste":
        if (event.data) {
          event.preventDefault();
          this.insertText(event.data);
        }
        break;
    }
  }

  private isPrintableKey(event: KeyboardEvent): boolean {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey;
  }

  private insertText(text: string): void {
    const state = this.getState();
    const selection = state.selection.main;

    // Get the offset range to replace
    const fromOffset = state.positionToOffset(selection.from);
    const toOffset = state.positionToOffset(selection.to);

    const transaction = state.transaction({
      changes: { from: fromOffset, to: toOffset, insert: text },
      userEvent: "input",
    });

    this.dispatch(transaction);
  }

  private deleteBackward(): void {
    const state = this.getState();
    const selection = state.selection.main;

    if (!selection.isEmpty) {
      // Delete selection
      const fromOffset = state.positionToOffset(selection.from);
      const toOffset = state.positionToOffset(selection.to);
      const transaction = state.transaction({
        changes: { from: fromOffset, to: toOffset, insert: "" },
        userEvent: "delete",
      });
      this.dispatch(transaction);
    } else {
      // Delete one character before cursor
      const offset = state.positionToOffset(selection.head);
      if (offset > 0) {
        const transaction = state.transaction({
          changes: { from: offset - 1, to: offset, insert: "" },
          userEvent: "delete",
        });
        this.dispatch(transaction);
      }
    }
  }

  private deleteForward(): void {
    const state = this.getState();
    const selection = state.selection.main;

    if (!selection.isEmpty) {
      // Delete selection
      const fromOffset = state.positionToOffset(selection.from);
      const toOffset = state.positionToOffset(selection.to);
      const transaction = state.transaction({
        changes: { from: fromOffset, to: toOffset, insert: "" },
        userEvent: "delete",
      });
      this.dispatch(transaction);
    } else {
      // Delete one character after cursor
      const offset = state.positionToOffset(selection.head);
      if (offset < state.length) {
        const transaction = state.transaction({
          changes: { from: offset, to: offset + 1, insert: "" },
          userEvent: "delete",
        });
        this.dispatch(transaction);
      }
    }
  }

  /**
   * Check if an event originated from an overlay element (like search panel)
   * These events should not be processed by the editor
   */
  private isEventFromOverlay(event: Event): boolean {
    const target = event.target as HTMLElement;
    if (!target) return false;

    // Check if the event target is inside a search panel or other overlay
    return (
      target.closest(".teppan-search-panel") !== null ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT"
    );
  }

  /**
   * Check if currently in IME composition
   */
  get isComposing(): boolean {
    return this.composing;
  }
}

/**
 * Create default key bindings
 */
export function defaultKeymap(): KeyBinding[] {
  return [
    // Basic cursor movement
    {
      key: "ArrowLeft",
      run: (state) => {
        const selection = state.selection.main;
        const offset = state.positionToOffset(selection.head);
        if (offset > 0) {
          const newPos = state.offsetToPosition(offset - 1);
          return state.transaction({
            selection: SelectionSet.cursor(newPos),
          });
        }
        return null;
      },
    },
    {
      key: "ArrowRight",
      run: (state) => {
        const selection = state.selection.main;
        const offset = state.positionToOffset(selection.head);
        if (offset < state.length) {
          const newPos = state.offsetToPosition(offset + 1);
          return state.transaction({
            selection: SelectionSet.cursor(newPos),
          });
        }
        return null;
      },
    },
    {
      key: "ArrowUp",
      run: (state) => {
        const selection = state.selection.main;
        const pos = selection.head;
        if (pos.line > 0) {
          const targetLine = state.line(pos.line - 1);
          if (targetLine) {
            const newColumn = Math.min(pos.column, targetLine.text.length);
            const newPos = { line: pos.line - 1, column: newColumn };
            return state.transaction({
              selection: SelectionSet.cursor(newPos),
            });
          }
        }
        return null;
      },
    },
    {
      key: "ArrowDown",
      run: (state) => {
        const selection = state.selection.main;
        const pos = selection.head;
        if (pos.line < state.lineCount - 1) {
          const targetLine = state.line(pos.line + 1);
          if (targetLine) {
            const newColumn = Math.min(pos.column, targetLine.text.length);
            const newPos = { line: pos.line + 1, column: newColumn };
            return state.transaction({
              selection: SelectionSet.cursor(newPos),
            });
          }
        }
        return null;
      },
    },
    // Home/End
    {
      key: "Home",
      run: (state) => {
        const selection = state.selection.main;
        const newPos = { line: selection.head.line, column: 0 };
        return state.transaction({
          selection: SelectionSet.cursor(newPos),
        });
      },
    },
    {
      key: "End",
      run: (state) => {
        const selection = state.selection.main;
        const lineInfo = state.line(selection.head.line);
        if (lineInfo) {
          const newPos = {
            line: selection.head.line,
            column: lineInfo.text.length,
          };
          return state.transaction({
            selection: SelectionSet.cursor(newPos),
          });
        }
        return null;
      },
    },
  ];
}
