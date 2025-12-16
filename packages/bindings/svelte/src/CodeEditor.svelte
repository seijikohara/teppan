<script lang="ts">
  import { applyTheme, injectBaseStyles, type Theme } from "@teppan/theme";
  import {
    EditorView,
    type EditorViewConfig,
    type Extension,
  } from "@teppan/view";
  import { onMount, onDestroy } from "svelte";

  interface Props {
    value?: string;
    readOnly?: boolean;
    tabSize?: number;
    lineNumbers?: boolean;
    placeholder?: string;
    ariaLabel?: string;
    height?: string | number;
    theme?: Theme;
    extensions?: Extension[];
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    readOnly = false,
    tabSize = 2,
    lineNumbers = true,
    placeholder = "",
    ariaLabel = "Code editor",
    height = "300px",
    theme,
    extensions = [],
    onchange,
  }: Props = $props();

  let containerElement: HTMLDivElement;
  let view: EditorView | null = null;

  onMount(() => {
    injectBaseStyles();

    const config: EditorViewConfig = {
      doc: value,
      parent: containerElement,
      readonly: readOnly,
      placeholder,
      lineNumbers,
      tabSize,
      extensions: [
        ...extensions,
        {
          name: "svelte-binding",
          updateListeners: [
            (update) => {
              if (update.transaction.docChanged) {
                value = update.state.doc;
                onchange?.(update.state.doc);
              }
            },
          ],
        },
      ],
    };

    view = new EditorView(config);

    if (theme) {
      applyTheme(view.dom, theme);
    }

    view.dom.setAttribute("aria-label", ariaLabel);
  });

  onDestroy(() => {
    view?.destroy();
    view = null;
  });

  const getContainerHeight = () =>
    typeof height === "number" ? `${height}px` : height;
</script>

<div
  bind:this={containerElement}
  class="teppan-svelte-container"
  style="height: {getContainerHeight()}"
></div>

<style>
  .teppan-svelte-container {
    width: 100%;
  }
</style>
