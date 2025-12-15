import { Editor, type EditorOptions, type EditorState } from "@teppan/core";
import { onDestroy } from "svelte";

export interface CreateEditorOptions extends EditorOptions {
  onChange?: (content: string) => void;
}

export interface CreateEditorReturn {
  editor: Editor;
  state: EditorState;
  setContent: (content: string) => void;
  insertText: (text: string) => void;
  getContent: () => string;
}

/**
 * Svelte 5 function for creating a headless editor with runes
 */
export function createEditor(
  options: CreateEditorOptions = {}
): CreateEditorReturn {
  const { onChange, ...editorOptions } = options;

  let state = $state<EditorState>({
    content: options.initialContent ?? "",
    cursor: { line: 0, column: 0 },
    selection: null,
    isDirty: false,
    language: options.language ?? "plaintext",
  });

  const editor = new Editor(editorOptions, {
    onChange: (content) => {
      state = editor.getState();
      onChange?.(content);
    },
    onCursorChange: () => {
      state = editor.getState();
    },
    onSelectionChange: () => {
      state = editor.getState();
    },
  });

  state = editor.getState();

  onDestroy(() => {
    editor.destroy();
  });

  const setContent = (content: string) => {
    editor.setContent(content);
  };

  const insertText = (text: string) => {
    editor.insertText(text);
  };

  const getContent = () => {
    return editor.getContent();
  };

  return {
    editor,
    get state() {
      return state;
    },
    setContent,
    insertText,
    getContent,
  };
}
