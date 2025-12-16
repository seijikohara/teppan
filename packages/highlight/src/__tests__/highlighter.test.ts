import { describe, expect, test, beforeEach } from "bun:test";
import {
  Highlighter,
  createHighlighterExtension,
  type HighlighterConfig,
} from "../highlighter";
import type { Language } from "../language";
import type { EditorState, Decoration } from "@teppan/state";

// Mock EditorState
function createMockState(doc: string): EditorState {
  const lines = doc.split("\n");
  let offset = 0;
  const lineInfos = lines.map((text, index) => {
    const from = offset;
    const to = offset + text.length;
    offset = to + 1; // +1 for newline
    return { text, from, to, number: index };
  });

  return {
    doc,
    length: doc.length,
    lineCount: lines.length,
    line: (n: number) => (n >= 0 && n < lineInfos.length ? lineInfos[n] : undefined),
    sliceDoc: (from: number, to?: number) => doc.slice(from, to),
  } as unknown as EditorState;
}

// Test language
const testLanguage: Language = {
  name: "test-lang",
  extensions: [".test"],
  patterns: [
    { pattern: /\b(if|else|return)\b/, type: "keyword" },
    { pattern: /"[^"]*"/, type: "string" },
    { pattern: /\b\d+\b/, type: "number" },
    { pattern: /\b[a-zA-Z_]\w*\b/, type: "variable" },
    { pattern: /\s+/, type: "text" },
  ],
};

describe("Highlighter", () => {
  let highlighter: Highlighter;

  beforeEach(() => {
    highlighter = new Highlighter();
  });

  describe("constructor", () => {
    test("creates highlighter without config", () => {
      const h = new Highlighter();
      expect(h.getLanguage()).toBeUndefined();
      expect(h.getTheme()).toBeUndefined();
    });

    test("creates highlighter with language", () => {
      const h = new Highlighter({ language: testLanguage });
      expect(h.getLanguage()).toBe(testLanguage);
    });

    test("creates highlighter with theme", () => {
      const theme = { name: "test-theme" };
      const h = new Highlighter({ theme } as HighlighterConfig);
      expect(h.getTheme()).toBe(theme);
    });
  });

  describe("setLanguage", () => {
    test("sets language", () => {
      highlighter.setLanguage(testLanguage);
      expect(highlighter.getLanguage()).toBe(testLanguage);
    });

    test("clears language with undefined", () => {
      highlighter.setLanguage(testLanguage);
      highlighter.setLanguage(undefined);
      expect(highlighter.getLanguage()).toBeUndefined();
    });

    test("invalidates cache when language changes", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("return 1");

      // Get tokens to populate cache
      const tokens1 = highlighter.getLineTokens(state, 0);
      expect(tokens1.length).toBeGreaterThan(0);

      // Change language
      const newLang: Language = {
        name: "other",
        extensions: [".other"],
        patterns: [{ pattern: /.*/, type: "comment" }],
      };
      highlighter.setLanguage(newLang);

      // Get tokens again - should be different
      const tokens2 = highlighter.getLineTokens(state, 0);
      expect(tokens2[0].type).toBe("comment");
    });
  });

  describe("setTheme", () => {
    test("sets theme", () => {
      const theme = { name: "test-theme" };
      highlighter.setTheme(theme as any);
      expect(highlighter.getTheme()).toBe(theme);
    });

    test("clears theme with undefined", () => {
      highlighter.setTheme({ name: "theme" } as any);
      highlighter.setTheme(undefined);
      expect(highlighter.getTheme()).toBeUndefined();
    });
  });

  describe("getLineTokens", () => {
    test("returns empty array without language", () => {
      const state = createMockState("return 1");
      const tokens = highlighter.getLineTokens(state, 0);
      expect(tokens).toEqual([]);
    });

    test("returns tokens for line", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("return 1");
      const tokens = highlighter.getLineTokens(state, 0);

      expect(tokens.length).toBeGreaterThan(0);
      const keywordToken = tokens.find((t) => t.type === "keyword");
      expect(keywordToken).toBeDefined();
    });

    test("returns empty for invalid line number", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("hello");
      expect(highlighter.getLineTokens(state, -1)).toEqual([]);
      expect(highlighter.getLineTokens(state, 100)).toEqual([]);
    });

    test("caches line tokens", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("return");

      const tokens1 = highlighter.getLineTokens(state, 0);
      const tokens2 = highlighter.getLineTokens(state, 0);

      // Same array reference due to caching
      expect(tokens1).toBe(tokens2);
    });

    test("handles multiple lines", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("if x\nreturn 1");

      const line0Tokens = highlighter.getLineTokens(state, 0);
      const line1Tokens = highlighter.getLineTokens(state, 1);

      expect(line0Tokens.find((t) => t.type === "keyword")?.from).toBe(0);
      expect(line1Tokens.find((t) => t.type === "keyword")?.from).toBe(5); // offset by first line + newline
    });
  });

  describe("getTokens", () => {
    test("returns tokens for range of lines", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("line1\nline2\nline3");
      const result = highlighter.getTokens(state, 0, 3);

      expect(result).toHaveLength(3);
      expect(result[0].line).toBe(0);
      expect(result[1].line).toBe(1);
      expect(result[2].line).toBe(2);
    });

    test("returns partial range", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("line1\nline2\nline3");
      const result = highlighter.getTokens(state, 1, 2);

      expect(result).toHaveLength(1);
      expect(result[0].line).toBe(1);
    });
  });

  describe("invalidateCache", () => {
    test("clears all cached tokens", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("return");

      const tokens1 = highlighter.getLineTokens(state, 0);
      highlighter.invalidateCache();
      const tokens2 = highlighter.getLineTokens(state, 0);

      // Different array references after invalidation
      expect(tokens1).not.toBe(tokens2);
    });
  });

  describe("invalidateLines", () => {
    test("clears cache for specific lines", () => {
      highlighter.setLanguage(testLanguage);
      const state = createMockState("line0\nline1\nline2");

      const line0First = highlighter.getLineTokens(state, 0);
      const line1First = highlighter.getLineTokens(state, 1);
      const line2First = highlighter.getLineTokens(state, 2);

      highlighter.invalidateLines(1, 1);

      const line0Second = highlighter.getLineTokens(state, 0);
      const line1Second = highlighter.getLineTokens(state, 1);
      const line2Second = highlighter.getLineTokens(state, 2);

      // Line 0 and 2 should still be cached
      expect(line0First).toBe(line0Second);
      expect(line2First).toBe(line2Second);
      // Line 1 should be re-tokenized
      expect(line1First).not.toBe(line1Second);
    });
  });

  describe("tokensToDecorations", () => {
    test("converts tokens to decorations", () => {
      highlighter.setLanguage(testLanguage);
      const tokens = [
        { type: "keyword" as const, from: 0, to: 6 },
        { type: "number" as const, from: 7, to: 8 },
      ];

      const decorations = highlighter.tokensToDecorations(tokens);

      expect(decorations).toHaveLength(2);
      expect(decorations[0]).toEqual({
        type: "range",
        from: 0,
        to: 6,
        class: "teppan-token-keyword",
      });
      expect(decorations[1]).toEqual({
        type: "range",
        from: 7,
        to: 8,
        class: "teppan-token-number",
      });
    });

    test("handles empty tokens array", () => {
      const decorations = highlighter.tokensToDecorations([]);
      expect(decorations).toEqual([]);
    });

    test("includes modifiers in class name", () => {
      const tokens = [
        {
          type: "variable" as const,
          from: 0,
          to: 3,
          modifiers: ["definition"],
        },
      ];

      const decorations = highlighter.tokensToDecorations(tokens);
      expect(decorations[0].class).toBe(
        "teppan-token-variable teppan-token-definition"
      );
    });
  });

  describe("createDecorationProvider", () => {
    test("returns function", () => {
      const provider = highlighter.createDecorationProvider();
      expect(typeof provider).toBe("function");
    });

    test("returns empty decorations without language", () => {
      const provider = highlighter.createDecorationProvider();
      const state = createMockState("return 1");
      const decorations = provider(state);
      expect(decorations).toEqual([]);
    });

    test("returns decorations for document", () => {
      highlighter.setLanguage(testLanguage);
      const provider = highlighter.createDecorationProvider();
      const state = createMockState("return 1");
      const decorations = provider(state);

      expect(decorations.length).toBeGreaterThan(0);
      expect(decorations.every((d) => d.type === "range")).toBe(true);
    });

    test("processes all lines", () => {
      highlighter.setLanguage(testLanguage);
      const provider = highlighter.createDecorationProvider();
      const state = createMockState("return\nif\nelse");
      const decorations = provider(state);

      // Should have keyword tokens from all three lines
      const keywordDecorations = decorations.filter((d) =>
        d.class?.includes("keyword")
      );
      expect(keywordDecorations.length).toBe(3);
    });
  });
});

describe("createHighlighterExtension", () => {
  test("creates extension object", () => {
    const ext = createHighlighterExtension();
    expect(ext.name).toBe("highlighter");
    expect(ext.decorationProviders).toHaveLength(1);
    expect(ext.highlighter).toBeInstanceOf(Highlighter);
  });

  test("creates extension with config", () => {
    const ext = createHighlighterExtension({ language: testLanguage });
    expect(ext.highlighter.getLanguage()).toBe(testLanguage);
  });

  test("decoration provider works through extension", () => {
    const ext = createHighlighterExtension({ language: testLanguage });
    const state = createMockState("return");
    const provider = ext.decorationProviders[0];
    const decorations = provider(state);

    expect(decorations.length).toBeGreaterThan(0);
  });
});
