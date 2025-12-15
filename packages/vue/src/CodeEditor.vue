<script setup lang="ts">
import { watch } from "vue";
import { useEditor, type UseEditorOptions } from "./useEditor";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "plaintext",
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  tabSize: {
    type: Number,
    default: 2,
  },
  lineNumbers: {
    type: Boolean,
    default: true,
  },
  wordWrap: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "",
  },
  ariaLabel: {
    type: String,
    default: "Code editor",
  },
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

const editorOptions: UseEditorOptions = {
  initialContent: props.modelValue,
  language: props.language,
  readOnly: props.readOnly,
  tabSize: props.tabSize,
  lineNumbers: props.lineNumbers,
  wordWrap: props.wordWrap,
  onChange: (content) => {
    emit("update:modelValue", content);
    emit("change", content);
  },
};

const { editor, state, setContent } = useEditor(editorOptions);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== state.value.content) {
      setContent(newValue);
    }
  }
);

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  setContent(target.value);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const textarea = e.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const tabSize = editor.value.getOptions().tabSize;
    const tab = " ".repeat(tabSize);

    const newValue =
      state.value.content.substring(0, start) +
      tab +
      state.value.content.substring(end);

    setContent(newValue);

    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + tabSize;
    });
  }
};
</script>

<template>
  <div class="teppan-editor">
    <textarea
      :value="state.content"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :readonly="readOnly"
      spellcheck="false"
      @input="handleInput"
      @keydown="handleKeyDown"
      @focus="editor.focus()"
      @blur="editor.blur()"
    />
  </div>
</template>

<style scoped>
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
  tab-size: v-bind("tabSize");
}
</style>
