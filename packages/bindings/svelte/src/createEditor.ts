import type { Theme } from "@teppan/theme";
import {
  type EditorState,
  EditorView,
  type EditorViewConfig,
  type Extension,
  type Transaction,
} from "@teppan/view";

export interface CreateEditorOptions {
  /** Initial content */
  initialContent?: string;
  /** Whether the editor is read-only */
  readonly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Tab size */
  tabSize?: number;
  /** Extensions to load */
  extensions?: Extension[];
  /** Theme to apply */
  theme?: Theme;
  /** Callback when content changes */
  onChange?: (content: string) => void;
}

export interface CreateEditorReturn {
  /** Current editor view (may be null before mount) */
  view: EditorView | null;
  /** Current editor state */
  state: EditorState | null;
  /** Mount the editor to an element */
  mount: (element: HTMLElement) => void;
  /** Destroy the editor */
  destroy: () => void;
  /** Get the current content */
  getContent: () => string;
  /** Set the content */
  setContent: (content: string) => void;
  /** Focus the editor */
  focus: () => void;
  /** Blur the editor */
  blur: () => void;
  /** Dispatch a transaction */
  dispatch: (transaction: Transaction) => void;
}

/**
 * Svelte 5 function for creating a headless editor with runes
 */
export function createEditor(
  options: CreateEditorOptions = {},
): CreateEditorReturn {
  const {
    initialContent = "",
    readonly = false,
    placeholder,
    lineNumbers = true,
    tabSize = 2,
    extensions = [],
    onChange,
  } = options;

  let view: EditorView | null = null;
  let state: EditorState | null = null;

  const mount = (element: HTMLElement) => {
    if (view) return; // Already mounted

    const config: EditorViewConfig = {
      doc: initialContent,
      parent: element,
      readonly,
      placeholder,
      lineNumbers,
      tabSize,
      extensions: [
        ...extensions,
        {
          name: "svelte-binding",
          updateListeners: [
            (update) => {
              state = update.state;
              if (update.transaction.docChanged) {
                onChange?.(update.state.doc);
              }
            },
          ],
        },
      ],
    };

    view = new EditorView(config);
    state = view.state;
  };

  const destroy = () => {
    view?.destroy();
    view = null;
  };

  const getContent = () => {
    return view?.state.doc ?? "";
  };

  const setContent = (content: string) => {
    if (!view) return;

    const transaction = view.state.transaction({
      changes: {
        from: 0,
        to: view.state.length,
        insert: content,
      },
    });
    view.dispatch(transaction);
  };

  const focus = () => {
    view?.focus();
  };

  const blur = () => {
    view?.blur();
  };

  const dispatch = (transaction: Transaction) => {
    view?.dispatch(transaction);
  };

  return {
    get view() {
      return view;
    },
    get state() {
      return state;
    },
    mount,
    destroy,
    getContent,
    setContent,
    focus,
    blur,
    dispatch,
  };
}
