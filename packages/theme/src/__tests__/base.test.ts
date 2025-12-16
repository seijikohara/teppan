import { describe, expect, test } from "bun:test";
import { baseStyles, injectBaseStyles, removeBaseStyles } from "../base";

// Mock document for testing
let mockDocument: {
  head: { appendChild: (el: any) => void };
  getElementById: (id: string) => any | null;
  createElement: (tag: string) => any;
};

let createdElements: any[];
let removedElements: any[];

describe("baseStyles", () => {
  test("is a non-empty string", () => {
    expect(typeof baseStyles).toBe("string");
    expect(baseStyles.length).toBeGreaterThan(0);
  });

  test("contains editor class", () => {
    expect(baseStyles).toContain(".teppan-editor");
  });

  test("contains scroller class", () => {
    expect(baseStyles).toContain(".teppan-scroller");
  });

  test("contains gutter class", () => {
    expect(baseStyles).toContain(".teppan-gutter");
  });

  test("contains content class", () => {
    expect(baseStyles).toContain(".teppan-content");
  });

  test("contains line class", () => {
    expect(baseStyles).toContain(".teppan-line");
  });

  test("contains cursor class", () => {
    expect(baseStyles).toContain(".teppan-cursor");
  });

  test("contains selection class", () => {
    expect(baseStyles).toContain(".teppan-selection");
  });

  test("contains cursor blink animation", () => {
    expect(baseStyles).toContain("@keyframes teppan-cursor-blink");
  });

  test("contains CSS variables with --teppan prefix", () => {
    expect(baseStyles).toContain("--teppan-bg");
    expect(baseStyles).toContain("--teppan-fg");
    expect(baseStyles).toContain("--teppan-cursor-color");
    expect(baseStyles).toContain("--teppan-selection-bg");
  });

  test("contains token classes for syntax highlighting", () => {
    expect(baseStyles).toContain(".teppan-token-keyword");
    expect(baseStyles).toContain(".teppan-token-string");
    expect(baseStyles).toContain(".teppan-token-comment");
    expect(baseStyles).toContain(".teppan-token-number");
    expect(baseStyles).toContain(".teppan-token-function");
    expect(baseStyles).toContain(".teppan-token-variable");
    expect(baseStyles).toContain(".teppan-token-operator");
    expect(baseStyles).toContain(".teppan-token-type");
  });

  test("contains light theme media query", () => {
    expect(baseStyles).toContain("@media (prefers-color-scheme: light)");
  });

  test("contains gutter element class", () => {
    expect(baseStyles).toContain(".teppan-gutter-element");
  });

  test("contains selection layer class", () => {
    expect(baseStyles).toContain(".teppan-selection-layer");
  });

  test("contains cursor layer class", () => {
    expect(baseStyles).toContain(".teppan-cursor-layer");
  });

  test("contains focused state styles", () => {
    expect(baseStyles).toContain(".teppan-focused");
  });

  test("contains readonly styles", () => {
    expect(baseStyles).toContain(".teppan-readonly");
  });

  test("contains matching bracket style", () => {
    expect(baseStyles).toContain(".teppan-matching-bracket");
  });

  test("contains active line style", () => {
    expect(baseStyles).toContain(".teppan-line.active");
  });

  test("contains scrollbar styles", () => {
    expect(baseStyles).toContain("scrollbar-width");
    expect(baseStyles).toContain("::-webkit-scrollbar");
  });
});

// Note: Full DOM tests for injectBaseStyles and removeBaseStyles
// would require a DOM environment like jsdom. Here we test
// that functions exist and have correct behavior in SSR (no document)

describe("injectBaseStyles", () => {
  test("is a function", () => {
    expect(typeof injectBaseStyles).toBe("function");
  });

  // The function handles typeof document === "undefined" gracefully
  // which is the case in non-browser environments like Bun test
  test("does not throw in non-browser environment", () => {
    expect(() => injectBaseStyles()).not.toThrow();
  });
});

describe("removeBaseStyles", () => {
  test("is a function", () => {
    expect(typeof removeBaseStyles).toBe("function");
  });

  test("does not throw in non-browser environment", () => {
    expect(() => removeBaseStyles()).not.toThrow();
  });
});
