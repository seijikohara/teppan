import type { Theme } from "@teppan/theme";
import {
  type EditorState,
  EditorView,
  type EditorViewConfig,
  type Extension,
  type Transaction,
} from "@teppan/view";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseEditorOptions {
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

export interface UseEditorReturn {
  /** Container ref to attach the editor */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Current editor view (may be null before mount) */
  view: EditorView | null;
  /** Current editor state */
  state: EditorState | null;
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
 * React hook for using the Teppan editor
 */
export function useEditor(options: UseEditorOptions = {}): UseEditorReturn {
  const {
    initialContent = "",
    readonly = false,
    placeholder,
    lineNumbers = true,
    tabSize = 2,
    extensions = [],
    onChange,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [state, setState] = useState<EditorState | null>(null);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create editor on mount (intentionally only runs once)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Editor should only be created once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const config: EditorViewConfig = {
      doc: initialContent,
      parent: containerRef.current,
      readonly,
      placeholder,
      lineNumbers,
      tabSize,
      extensions: [
        ...extensions,
        {
          name: "react-binding",
          updateListeners: [
            (update) => {
              setState(update.state);
              if (update.transaction.docChanged) {
                onChangeRef.current?.(update.state.doc);
              }
            },
          ],
        },
      ],
    };

    const view = new EditorView(config);
    viewRef.current = view;
    setState(view.state);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only run on mount

  const getContent = useCallback(() => {
    return viewRef.current?.state.doc ?? "";
  }, []);

  const setContent = useCallback((content: string) => {
    const view = viewRef.current;
    if (!view) return;

    const transaction = view.state.transaction({
      changes: {
        from: 0,
        to: view.state.length,
        insert: content,
      },
    });
    view.dispatch(transaction);
  }, []);

  const focus = useCallback(() => {
    viewRef.current?.focus();
  }, []);

  const blur = useCallback(() => {
    viewRef.current?.blur();
  }, []);

  const dispatch = useCallback((transaction: Transaction) => {
    viewRef.current?.dispatch(transaction);
  }, []);

  return {
    containerRef,
    view: viewRef.current,
    state,
    getContent,
    setContent,
    focus,
    blur,
    dispatch,
  };
}
