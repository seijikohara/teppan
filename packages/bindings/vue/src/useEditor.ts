import type { Theme } from "@teppan/theme";
import {
  type EditorState,
  EditorView,
  type EditorViewConfig,
  type Extension,
  type Transaction,
} from "@teppan/view";
import { type ShallowRef, onMounted, onUnmounted, shallowRef } from "vue";

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
  containerRef: ShallowRef<HTMLDivElement | null>;
  /** Current editor view (may be null before mount) */
  view: ShallowRef<EditorView | null>;
  /** Current editor state */
  state: ShallowRef<EditorState | null>;
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
 * Vue 3 composable for using the Teppan editor
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

  const containerRef = shallowRef<HTMLDivElement | null>(null);
  const view = shallowRef<EditorView | null>(null);
  const state = shallowRef<EditorState | null>(null);

  onMounted(() => {
    if (!containerRef.value) return;

    const config: EditorViewConfig = {
      doc: initialContent,
      parent: containerRef.value,
      readonly,
      placeholder,
      lineNumbers,
      tabSize,
      extensions: [
        ...extensions,
        {
          name: "vue-binding",
          updateListeners: [
            (update) => {
              state.value = update.state;
              if (update.transaction.docChanged) {
                onChange?.(update.state.doc);
              }
            },
          ],
        },
      ],
    };

    view.value = new EditorView(config);
    state.value = view.value.state;
  });

  onUnmounted(() => {
    view.value?.destroy();
    view.value = null;
  });

  const getContent = () => {
    return view.value?.state.doc ?? "";
  };

  const setContent = (content: string) => {
    const v = view.value;
    if (!v) return;

    const transaction = v.state.transaction({
      changes: {
        from: 0,
        to: v.state.length,
        insert: content,
      },
    });
    v.dispatch(transaction);
  };

  const focus = () => {
    view.value?.focus();
  };

  const blur = () => {
    view.value?.blur();
  };

  const dispatch = (transaction: Transaction) => {
    view.value?.dispatch(transaction);
  };

  return {
    containerRef,
    view,
    state,
    getContent,
    setContent,
    focus,
    blur,
    dispatch,
  };
}
