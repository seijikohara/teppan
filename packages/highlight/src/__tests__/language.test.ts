import { beforeEach, describe, expect, test } from "bun:test";
import {
  type Language,
  LanguageRegistry,
  getLanguage,
  globalLanguageRegistry,
  registerLanguage,
  tokenize,
  tokenizeLine,
} from "../language";

// Test language definition
// Note: extensions should NOT include the dot, as the registry stores them without dots
const testLanguage: Language = {
  name: "test-lang",
  extensions: ["test", "tst"],
  mimeTypes: ["text/x-test"],
  patterns: [
    { pattern: /\/\/.*/, type: "comment" },
    { pattern: /\b(if|else|while|for|return)\b/, type: "keyword" },
    { pattern: /"[^"]*"/, type: "string" },
    { pattern: /\b\d+\b/, type: "number" },
    { pattern: /\b[a-zA-Z_]\w*(?=\s*\()/, type: "function" },
    { pattern: /\b[a-zA-Z_]\w*\b/, type: "variable" },
    { pattern: /[+\-*/%=<>!&|]+/, type: "operator" },
    { pattern: /[{}()[\];,]/, type: "punctuation" },
    { pattern: /\s+/, type: "text" },
  ],
  lineComment: "//",
  brackets: [
    ["(", ")"],
    ["{", "}"],
    ["[", "]"],
  ],
};

describe("LanguageRegistry", () => {
  let registry: LanguageRegistry;

  beforeEach(() => {
    registry = new LanguageRegistry();
  });

  describe("register", () => {
    test("registers a language", () => {
      registry.register(testLanguage);
      expect(registry.has("test-lang")).toBe(true);
    });

    test("allows retrieving registered language", () => {
      registry.register(testLanguage);
      const lang = registry.get("test-lang");
      expect(lang).toBeDefined();
      expect(lang?.name).toBe("test-lang");
    });
  });

  describe("get", () => {
    test("returns undefined for unregistered language", () => {
      expect(registry.get("nonexistent")).toBeUndefined();
    });

    test("returns registered language", () => {
      registry.register(testLanguage);
      const lang = registry.get("test-lang");
      expect(lang).toBe(testLanguage);
    });
  });

  describe("getByExtension", () => {
    test("finds language by extension without dot", () => {
      registry.register(testLanguage);
      const lang = registry.getByExtension("test");
      expect(lang).toBe(testLanguage);
    });

    test("finds language by extension with dot", () => {
      registry.register(testLanguage);
      const lang = registry.getByExtension(".test");
      expect(lang).toBe(testLanguage);
    });

    test("finds language case-insensitively", () => {
      registry.register(testLanguage);
      const lang = registry.getByExtension(".TEST");
      expect(lang).toBe(testLanguage);
    });

    test("returns undefined for unknown extension", () => {
      registry.register(testLanguage);
      expect(registry.getByExtension(".unknown")).toBeUndefined();
    });
  });

  describe("getByMimeType", () => {
    test("finds language by MIME type", () => {
      registry.register(testLanguage);
      const lang = registry.getByMimeType("text/x-test");
      expect(lang).toBe(testLanguage);
    });

    test("returns undefined for unknown MIME type", () => {
      registry.register(testLanguage);
      expect(registry.getByMimeType("text/unknown")).toBeUndefined();
    });

    test("handles language without MIME types", () => {
      const langWithoutMime: Language = {
        name: "no-mime",
        extensions: [".nm"],
        patterns: [],
      };
      registry.register(langWithoutMime);
      expect(registry.getByMimeType("text/anything")).toBeUndefined();
    });
  });

  describe("getAll", () => {
    test("returns empty array when no languages registered", () => {
      expect(registry.getAll()).toEqual([]);
    });

    test("returns all registered languages", () => {
      const lang2: Language = {
        name: "test-lang-2",
        extensions: [".t2"],
        patterns: [],
      };
      registry.register(testLanguage);
      registry.register(lang2);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(testLanguage);
      expect(all).toContain(lang2);
    });
  });

  describe("has", () => {
    test("returns false for unregistered language", () => {
      expect(registry.has("nonexistent")).toBe(false);
    });

    test("returns true for registered language", () => {
      registry.register(testLanguage);
      expect(registry.has("test-lang")).toBe(true);
    });
  });
});

describe("global registry functions", () => {
  test("registerLanguage adds to global registry", () => {
    const uniqueLang: Language = {
      name: "unique-test-lang",
      extensions: [".unique"],
      patterns: [],
    };
    registerLanguage(uniqueLang);
    expect(globalLanguageRegistry.has("unique-test-lang")).toBe(true);
  });

  test("getLanguage retrieves from global registry", () => {
    const uniqueLang: Language = {
      name: "another-unique-lang",
      extensions: [".au"],
      patterns: [],
    };
    registerLanguage(uniqueLang);
    const lang = getLanguage("another-unique-lang");
    expect(lang).toBe(uniqueLang);
  });
});

describe("tokenize", () => {
  test("tokenizes empty string", () => {
    const tokens = tokenize("", testLanguage);
    expect(tokens).toEqual([]);
  });

  test("tokenizes single keyword", () => {
    const tokens = tokenize("return", testLanguage);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({
      type: "keyword",
      from: 0,
      to: 6,
      modifiers: undefined,
    });
  });

  test("tokenizes string literal", () => {
    const tokens = tokenize('"hello"', testLanguage);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({
      type: "string",
      from: 0,
      to: 7,
      modifiers: undefined,
    });
  });

  test("tokenizes number", () => {
    const tokens = tokenize("42", testLanguage);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({
      type: "number",
      from: 0,
      to: 2,
      modifiers: undefined,
    });
  });

  test("tokenizes comment", () => {
    const tokens = tokenize("// comment", testLanguage);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({
      type: "comment",
      from: 0,
      to: 10,
      modifiers: undefined,
    });
  });

  test("tokenizes function call", () => {
    const tokens = tokenize("foo()", testLanguage);
    expect(tokens.length).toBeGreaterThanOrEqual(2);
    expect(tokens[0].type).toBe("function");
  });

  test("tokenizes multiple tokens", () => {
    const tokens = tokenize("if (x) return 1", testLanguage);
    const types = tokens.map((t) => t.type);

    expect(types).toContain("keyword"); // if, return
    expect(types).toContain("punctuation"); // (, )
    expect(types).toContain("variable"); // x
    expect(types).toContain("number"); // 1
  });

  test("preserves token positions", () => {
    const tokens = tokenize("abc def", testLanguage);
    // "abc" at 0-3, space at 3-4, "def" at 4-7
    const abcToken = tokens.find((t) => t.type === "variable" && t.from === 0);
    const defToken = tokens.find((t) => t.type === "variable" && t.from === 4);

    expect(abcToken).toBeDefined();
    expect(abcToken?.to).toBe(3);
    expect(defToken).toBeDefined();
    expect(defToken?.to).toBe(7);
  });

  test("skips unmatched characters", () => {
    const minimalLang: Language = {
      name: "minimal",
      extensions: [".min"],
      patterns: [{ pattern: /\d+/, type: "number" }],
    };
    // Only numbers are matched, letters are skipped
    const tokens = tokenize("a1b2c", minimalLang);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual({
      type: "number",
      from: 1,
      to: 2,
      modifiers: undefined,
    });
    expect(tokens[1]).toEqual({
      type: "number",
      from: 3,
      to: 4,
      modifiers: undefined,
    });
  });

  test("includes modifiers from pattern", () => {
    const langWithModifiers: Language = {
      name: "with-mods",
      extensions: [".wm"],
      patterns: [
        {
          pattern: /\bconst\b/,
          type: "keyword",
          modifiers: ["declaration", "readonly"],
        },
      ],
    };
    const tokens = tokenize("const", langWithModifiers);
    expect(tokens[0].modifiers).toEqual(["declaration", "readonly"]);
  });
});

describe("tokenizeLine", () => {
  test("adjusts offsets by line offset", () => {
    const tokens = tokenizeLine("return", 100, testLanguage);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({
      type: "keyword",
      from: 100,
      to: 106,
      modifiers: undefined,
    });
  });

  test("handles empty line", () => {
    const tokens = tokenizeLine("", 50, testLanguage);
    expect(tokens).toEqual([]);
  });

  test("adjusts multiple token positions", () => {
    const tokens = tokenizeLine("if x", 20, testLanguage);
    const ifToken = tokens.find((t) => t.type === "keyword");
    const xToken = tokens.find((t) => t.type === "variable" && t.from >= 20);

    expect(ifToken?.from).toBe(20);
    expect(ifToken?.to).toBe(22);
    expect(xToken?.from).toBe(23);
    expect(xToken?.to).toBe(24);
  });
});
