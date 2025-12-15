<script lang="ts">
  import { createEditor, type CreateEditorOptions } from "./createEditor.svelte";
  import { untrack } from "svelte";

  interface Props {
    value?: string;
    language?: string;
    readOnly?: boolean;
    tabSize?: number;
    lineNumbers?: boolean;
    wordWrap?: boolean;
    placeholder?: string;
    ariaLabel?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    language = "plaintext",
    readOnly = false,
    tabSize = 2,
    lineNumbers = true,
    wordWrap = false,
    placeholder = "",
    ariaLabel = "Code editor",
    onchange,
  }: Props = $props();

  // Capture initial values for editor initialization (intentionally non-reactive)
  const initialOptions: CreateEditorOptions = untrack(() => ({
    initialContent: value,
    language,
    readOnly,
    tabSize,
    lineNumbers,
    wordWrap,
    onChange: (content: string) => {
      value = content;
      onchange?.(content);
    },
  }));

  const { editor, state: editorState, setContent } = createEditor(initialOptions);

  $effect(() => {
    if (value !== editorState.content) {
      setContent(value);
    }
  });

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    setContent(target.value);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentTabSize = editor.getOptions().tabSize;
      const tab = " ".repeat(currentTabSize);

      const newValue =
        editorState.content.substring(0, start) +
        tab +
        editorState.content.substring(end);

      setContent(newValue);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + currentTabSize;
      });
    }
  }
</script>

<div class="teppan-editor">
  <textarea
    value={editorState.content}
    {placeholder}
    aria-label={ariaLabel}
    readonly={readOnly}
    spellcheck="false"
    oninput={handleInput}
    onkeydown={handleKeyDown}
    onfocus={() => editor.focus()}
    onblur={() => editor.blur()}
    style="tab-size: {tabSize}"
  ></textarea>
</div>

<style>
  .teppan-editor {
    position: relative;
  }

  .teppan-editor textarea {
    width: 100%;
    min-height: 200px;
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
  }
</style>
