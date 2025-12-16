/**
 * DOM manipulation utilities for the editor view
 */

/**
 * CSS class names used by the editor
 */
export const CSS = {
  editor: "teppan-editor",
  scroller: "teppan-scroller",
  content: "teppan-content",
  gutter: "teppan-gutter",
  gutterElement: "teppan-gutter-element",
  line: "teppan-line",
  lineNumber: "teppan-line-number",
  cursor: "teppan-cursor",
  selection: "teppan-selection",
  selectionLayer: "teppan-selection-layer",
  cursorLayer: "teppan-cursor-layer",
  focused: "teppan-focused",
  readonly: "teppan-readonly",
} as const;

/**
 * Create an element with the given tag, class, and optional attributes
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attributes?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
  }
  return element;
}

/**
 * Create a text node
 */
export function createTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Remove all children from an element
 */
export function clearElement(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Set multiple styles on an element
 */
export function setStyles(
  element: HTMLElement,
  styles: Record<string, string | undefined>,
): void {
  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined) {
      element.style.setProperty(key, value);
    }
  }
}

/**
 * Get the bounding client rect of an element
 */
export function getBoundingRect(element: Element): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * Check if an element is in the viewport
 */
export function isInViewport(element: Element, container: Element): boolean {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return (
    elementRect.top < containerRect.bottom &&
    elementRect.bottom > containerRect.top
  );
}

/**
 * Scroll an element into view within a container
 */
export function scrollIntoView(
  element: Element,
  container: Element,
  options?: { block?: "start" | "center" | "end" | "nearest" },
): void {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const block = options?.block ?? "nearest";

  if (block === "nearest") {
    if (elementRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - elementRect.top;
    } else if (elementRect.bottom > containerRect.bottom) {
      container.scrollTop += elementRect.bottom - containerRect.bottom;
    }
  } else if (block === "start") {
    container.scrollTop += elementRect.top - containerRect.top;
  } else if (block === "center") {
    container.scrollTop +=
      elementRect.top -
      containerRect.top -
      containerRect.height / 2 +
      elementRect.height / 2;
  } else if (block === "end") {
    container.scrollTop += elementRect.bottom - containerRect.bottom;
  }
}

/**
 * Measure the size of a character in the editor font
 */
export function measureCharSize(container: HTMLElement): {
  width: number;
  height: number;
} {
  const measureElement = createElement("span", undefined, {
    "aria-hidden": "true",
  });
  measureElement.textContent = "x";

  // Get computed styles from container to ensure consistent measurement
  const containerStyle = getComputedStyle(container);
  setStyles(measureElement, {
    position: "absolute",
    visibility: "hidden",
    whiteSpace: "pre",
    font: containerStyle.font,
    lineHeight: containerStyle.lineHeight,
  });

  container.appendChild(measureElement);
  const rect = measureElement.getBoundingClientRect();
  container.removeChild(measureElement);

  return { width: rect.width, height: rect.height };
}

/**
 * Create the base editor DOM structure
 */
export function createEditorDOM(): {
  wrapper: HTMLDivElement;
  scroller: HTMLDivElement;
  content: HTMLDivElement;
  gutter: HTMLDivElement;
  selectionLayer: HTMLDivElement;
  cursorLayer: HTMLDivElement;
} {
  const wrapper = createElement("div", CSS.editor);
  wrapper.setAttribute("role", "textbox");
  wrapper.setAttribute("aria-multiline", "true");
  wrapper.tabIndex = 0;

  const scroller = createElement("div", CSS.scroller);
  const gutter = createElement("div", CSS.gutter);
  const content = createElement("div", CSS.content);
  const selectionLayer = createElement("div", CSS.selectionLayer);
  const cursorLayer = createElement("div", CSS.cursorLayer);

  content.appendChild(selectionLayer);
  content.appendChild(cursorLayer);

  scroller.appendChild(gutter);
  scroller.appendChild(content);
  wrapper.appendChild(scroller);

  return { wrapper, scroller, content, gutter, selectionLayer, cursorLayer };
}
