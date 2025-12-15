import {
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { useEditor, type UseEditorOptions } from "./useEditor";

export interface CodeEditorProps extends UseEditorOptions {
  /** CSS class name for the container */
  className?: string;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

/**
 * React code editor component
 */
export function CodeEditor({
  className,
  placeholder,
  ariaLabel = "Code editor",
  onChange,
  ...options
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { editor, state, setContent } = useEditor({ ...options, onChange });

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
    },
    [setContent]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const tabSize = editor.getOptions().tabSize;
        const tab = " ".repeat(tabSize);

        const newValue =
          state.content.substring(0, start) +
          tab +
          state.content.substring(end);

        setContent(newValue);

        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + tabSize;
        });
      }
    },
    [editor, state.content, setContent]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.value = state.content;
    }
  }, [state.content]);

  return (
    <div className={className} style={{ position: "relative" }}>
      <textarea
        ref={textareaRef}
        defaultValue={state.content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => editor.focus()}
        onBlur={() => editor.blur()}
        placeholder={placeholder}
        aria-label={ariaLabel}
        readOnly={options.readOnly}
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: "200px",
          fontFamily: "monospace",
          fontSize: "14px",
          lineHeight: "1.5",
          padding: "12px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          resize: "vertical",
          tabSize: editor.getOptions().tabSize,
        }}
      />
    </div>
  );
}
