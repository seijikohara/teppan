import { ref, shallowRef, onUnmounted, type Ref, type ShallowRef } from "vue";
import { Editor, type EditorOptions, type EditorState } from "@teppan/core";

export interface UseEditorOptions extends EditorOptions {
  onChange?: (content: string) => void;
}

export interface UseEditorReturn {
  editor: ShallowRef<Editor>;
  state: Ref<EditorState>;
  setContent: (content: string) => void;
  insertText: (text: string) => void;
  getContent: () => string;
}

/**
 * Vue 3 composable for using the headless editor
 */
export function useEditor(options: UseEditorOptions = {}): UseEditorReturn {
  const { onChange, ...editorOptions } = options;

  const editor = shallowRef<Editor>(null!);
  const state = ref<EditorState>(null!);

  const editorInstance = new Editor(editorOptions, {
    onChange: (content) => {
      state.value = editorInstance.getState();
      onChange?.(content);
    },
    onCursorChange: () => {
      state.value = editorInstance.getState();
    },
    onSelectionChange: () => {
      state.value = editorInstance.getState();
    },
  });

  editor.value = editorInstance;
  state.value = editorInstance.getState();

  onUnmounted(() => {
    editor.value?.destroy();
  });

  const setContent = (content: string) => {
    editor.value?.setContent(content);
  };

  const insertText = (text: string) => {
    editor.value?.insertText(text);
  };

  const getContent = () => {
    return editor.value?.getContent() ?? "";
  };

  return {
    editor,
    state,
    setContent,
    insertText,
    getContent,
  };
}
