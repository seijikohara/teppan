<script setup lang="ts">
import { watch, onMounted, type PropType } from "vue";
import { useEditor, type UseEditorOptions } from "./useEditor";
import { applyTheme, injectBaseStyles, type Theme } from "@teppan/theme";
import type { Extension } from "@teppan/view";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
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
  placeholder: {
    type: String,
    default: "",
  },
  ariaLabel: {
    type: String,
    default: "Code editor",
  },
  height: {
    type: [String, Number] as PropType<string | number>,
    default: "300px",
  },
  theme: {
    type: Object as PropType<Theme>,
    default: undefined,
  },
  extensions: {
    type: Array as PropType<Extension[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

const editorOptions: UseEditorOptions = {
  initialContent: props.modelValue,
  readonly: props.readOnly,
  tabSize: props.tabSize,
  lineNumbers: props.lineNumbers,
  placeholder: props.placeholder,
  extensions: props.extensions,
  theme: props.theme,
  onChange: (content) => {
    emit("update:modelValue", content);
    emit("change", content);
  },
};

const { containerRef, view, state, setContent } = useEditor(editorOptions);

// Inject base styles on mount
onMounted(() => {
  injectBaseStyles();
});

// Watch for external content changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (state.value && newValue !== state.value.doc) {
      setContent(newValue);
    }
  }
);

// Apply theme when it changes
watch(
  () => props.theme,
  (theme) => {
    if (view.value && theme) {
      applyTheme(view.value.dom, theme);
    }
  },
  { immediate: true }
);

// Update aria-label
watch(
  () => props.ariaLabel,
  (ariaLabel) => {
    if (view.value) {
      view.value.dom.setAttribute("aria-label", ariaLabel);
    }
  }
);

const containerHeight = typeof props.height === "number" ? `${props.height}px` : props.height;
</script>

<template>
  <div
    ref="containerRef"
    class="teppan-vue-container"
    :style="{ height: containerHeight }"
  />
</template>

<style scoped>
.teppan-vue-container {
  width: 100%;
}
</style>
