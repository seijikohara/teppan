/**
 * Base CSS styles for the editor
 * These styles should be included in the page to provide
 * the foundation for the editor appearance.
 */
export const baseStyles = `
.teppan-editor {
  position: relative;
  height: 100%;
  font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  font-feature-settings: "liga" 1, "calt" 1;
  background: var(--teppan-bg, #0d1117);
  color: var(--teppan-fg, #e6edf3);
  border: 1px solid var(--teppan-border, #30363d);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03),
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.teppan-editor:hover {
  border-color: var(--teppan-border-hover, #3d444d);
}

.teppan-editor:focus,
.teppan-editor.teppan-focused {
  outline: none;
  border-color: var(--teppan-focus-ring, #2f81f7);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03),
    0 0 0 3px rgba(47, 129, 247, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.teppan-scroller {
  display: flex;
  overflow: auto;
  height: 100%;
  scrollbar-width: thin;
  scrollbar-color: var(--teppan-scrollbar-thumb, #484f58) var(--teppan-scrollbar-track, transparent);
}

.teppan-scroller::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.teppan-scroller::-webkit-scrollbar-track {
  background: var(--teppan-scrollbar-track, transparent);
}

.teppan-scroller::-webkit-scrollbar-thumb {
  background: var(--teppan-scrollbar-thumb, #484f58);
  border-radius: 4px;
}

.teppan-scroller::-webkit-scrollbar-thumb:hover {
  background: var(--teppan-scrollbar-thumb-hover, #6e7681);
}

.teppan-gutter {
  position: relative;
  flex-shrink: 0;
  background: var(--teppan-gutter-bg, rgba(13, 17, 23, 0.6));
  border-right: 1px solid var(--teppan-gutter-border, #21262d);
  padding: 16px 16px 16px 20px;
  text-align: right;
  user-select: none;
}

.teppan-gutter-element {
  color: var(--teppan-gutter-fg, #6e7681);
  font-size: 13px;
  font-weight: 400;
  transition: color 0.15s ease;
}

.teppan-gutter-element:hover {
  color: var(--teppan-gutter-fg-hover, #8b949e);
}

.teppan-content {
  position: relative;
  flex: 1;
  padding: 16px 20px 16px 20px;
  white-space: pre;
  overflow: hidden;
}

.teppan-line {
  position: relative;
  padding: 0 4px;
  border-radius: 4px;
  transition: background-color 0.1s ease;
}

.teppan-selection-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.teppan-cursor-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.teppan-selection {
  background: var(--teppan-selection-bg, rgba(47, 129, 247, 0.4));
  border-radius: 3px;
}

.teppan-editor:not(.teppan-focused) .teppan-selection {
  background: var(--teppan-selection-bg-unfocused, rgba(110, 118, 129, 0.3));
}

.teppan-cursor {
  width: var(--teppan-cursor-width, 2px);
  background: var(--teppan-cursor-color, #58a6ff);
  border-radius: 1px;
  animation: teppan-cursor-blink 1.1s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(88, 166, 255, 0.5);
}

@keyframes teppan-cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.teppan-editor:not(.teppan-focused) .teppan-cursor {
  display: none;
}

.teppan-readonly .teppan-cursor {
  display: none;
}

/* Active line highlight */
.teppan-line.active {
  background: var(--teppan-active-line, rgba(22, 27, 34, 0.8));
}

/* Matching bracket highlight */
.teppan-matching-bracket,
.teppan-bracket-match {
  background: var(--teppan-matching-bracket, rgba(59, 80, 112, 0.6));
  border-radius: 3px;
  outline: 1px solid rgba(88, 166, 255, 0.4);
}

/* Unmatched bracket highlight */
.teppan-bracket-unmatched {
  background: var(--teppan-unmatched-bracket, rgba(248, 81, 73, 0.3));
  border-radius: 3px;
  outline: 1px solid rgba(248, 81, 73, 0.6);
}

/* Token styles with smooth color transitions */
.teppan-token-comment { color: var(--teppan-token-comment, #8b949e); font-style: italic; }
.teppan-token-keyword { color: var(--teppan-token-keyword, #ff7b72); font-weight: 500; }
.teppan-token-string { color: var(--teppan-token-string, #a5d6ff); }
.teppan-token-number { color: var(--teppan-token-number, #79c0ff); }
.teppan-token-operator { color: var(--teppan-token-operator, #ff7b72); }
.teppan-token-function { color: var(--teppan-token-function, #d2a8ff); }
.teppan-token-variable { color: var(--teppan-token-variable, #e6edf3); }
.teppan-token-type { color: var(--teppan-token-type, #79c0ff); font-weight: 500; }
.teppan-token-class { color: var(--teppan-token-class, #f0883e); font-weight: 500; }
.teppan-token-property { color: var(--teppan-token-property, #79c0ff); }
.teppan-token-punctuation { color: var(--teppan-token-punctuation, #8b949e); }
.teppan-token-regexp { color: var(--teppan-token-regexp, #7ee787); }
.teppan-token-constant { color: var(--teppan-token-constant, #79c0ff); }
.teppan-token-boolean { color: var(--teppan-token-boolean, #79c0ff); }
.teppan-token-null { color: var(--teppan-token-null, #79c0ff); }
.teppan-token-tag { color: var(--teppan-token-tag, #7ee787); }
.teppan-token-attribute { color: var(--teppan-token-attribute, #79c0ff); }
.teppan-token-namespace { color: var(--teppan-token-namespace, #f0883e); }
.teppan-token-label { color: var(--teppan-token-label, #d2a8ff); }
.teppan-token-meta { color: var(--teppan-token-meta, #8b949e); }
.teppan-token-invalid { color: var(--teppan-token-invalid, #f85149); text-decoration: wavy underline var(--teppan-token-invalid, #f85149); }
.teppan-token-deprecated { color: var(--teppan-token-deprecated, #ffa657); text-decoration: line-through; opacity: 0.7; }

/* Light theme support */
@media (prefers-color-scheme: light) {
  .teppan-editor:not([data-theme="dark"]) {
    --teppan-bg: #ffffff;
    --teppan-fg: #24292f;
    --teppan-border: #d0d7de;
    --teppan-border-hover: #b6bfc8;
    --teppan-focus-ring: #0969da;
    --teppan-gutter-bg: #f6f8fa;
    --teppan-gutter-border: #d0d7de;
    --teppan-gutter-fg: #656d76;
    --teppan-gutter-fg-hover: #424a53;
    --teppan-active-line: #f6f8fa;
    --teppan-selection-bg: rgba(9, 105, 218, 0.3);
    --teppan-selection-bg-unfocused: rgba(175, 184, 193, 0.3);
    --teppan-cursor-color: #0969da;
    --teppan-scrollbar-thumb: #afb8c1;
    --teppan-scrollbar-thumb-hover: #8c959f;
    --teppan-matching-bracket: rgba(9, 105, 218, 0.2);
  }
}
`;

/**
 * Inject base styles into the document
 */
export function injectBaseStyles(): void {
  if (typeof document === "undefined") return;

  const styleId = "teppan-base-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = baseStyles;
  document.head.appendChild(style);
}

/**
 * Remove base styles from the document
 */
export function removeBaseStyles(): void {
  if (typeof document === "undefined") return;

  const style = document.getElementById("teppan-base-styles");
  if (style) {
    style.remove();
  }
}
