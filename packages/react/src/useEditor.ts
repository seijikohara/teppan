import { useRef, useState, useCallback, useEffect } from "react";
import { Editor, type EditorOptions, type EditorState } from "@teppan/core";

export interface UseEditorOptions extends EditorOptions {
  onChange?: (content: string) => void;
}

export interface UseEditorReturn {
  editor: Editor;
  state: EditorState;
  setContent: (content: string) => void;
  insertText: (text: string) => void;
  getContent: () => string;
}

/**
 * React hook for using the headless editor
 */
export function useEditor(options: UseEditorOptions = {}): UseEditorReturn {
  const { onChange, ...editorOptions } = options;

  const editorRef = useRef<Editor | null>(null);

  const [state, setState] = useState<EditorState>(() => {
    const editor = new Editor(editorOptions, {
      onChange: (content) => {
        setState(editor.getState());
        onChange?.(content);
      },
      onCursorChange: () => {
        setState(editor.getState());
      },
      onSelectionChange: () => {
        setState(editor.getState());
      },
    });
    editorRef.current = editor;
    return editor.getState();
  });

  useEffect(() => {
    return () => {
      editorRef.current?.destroy();
    };
  }, []);

  const setContent = useCallback((content: string) => {
    editorRef.current?.setContent(content);
  }, []);

  const insertText = useCallback((text: string) => {
    editorRef.current?.insertText(text);
  }, []);

  const getContent = useCallback(() => {
    return editorRef.current?.getContent() ?? "";
  }, []);

  return {
    editor: editorRef.current!,
    state,
    setContent,
    insertText,
    getContent,
  };
}
