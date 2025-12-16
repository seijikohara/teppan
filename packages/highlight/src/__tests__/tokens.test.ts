import { describe, expect, test } from "bun:test";
import { tokenClassName, createToken, type Token } from "../tokens";

describe("tokens", () => {
  describe("createToken", () => {
    test("creates token with basic properties", () => {
      const token = createToken("keyword", 0, 5);
      expect(token.type).toBe("keyword");
      expect(token.from).toBe(0);
      expect(token.to).toBe(5);
      expect(token.modifiers).toBeUndefined();
    });

    test("creates token with modifiers", () => {
      const token = createToken("variable", 10, 20, ["definition", "readonly"]);
      expect(token.type).toBe("variable");
      expect(token.from).toBe(10);
      expect(token.to).toBe(20);
      expect(token.modifiers).toEqual(["definition", "readonly"]);
    });
  });

  describe("tokenClassName", () => {
    test("generates class name for simple token", () => {
      const token: Token = { type: "keyword", from: 0, to: 5 };
      expect(tokenClassName(token)).toBe("teppan-token-keyword");
    });

    test("generates class name with modifiers", () => {
      const token: Token = {
        type: "variable",
        from: 0,
        to: 5,
        modifiers: ["definition"],
      };
      expect(tokenClassName(token)).toBe(
        "teppan-token-variable teppan-token-definition"
      );
    });

    test("generates class name with multiple modifiers", () => {
      const token: Token = {
        type: "function",
        from: 0,
        to: 10,
        modifiers: ["async", "declaration"],
      };
      expect(tokenClassName(token)).toBe(
        "teppan-token-function teppan-token-async teppan-token-declaration"
      );
    });

    test("handles all token types", () => {
      const tokenTypes = [
        "comment",
        "keyword",
        "string",
        "number",
        "operator",
        "function",
        "variable",
        "type",
        "class",
        "property",
        "punctuation",
        "regexp",
        "constant",
        "boolean",
        "null",
        "tag",
        "attribute",
        "namespace",
        "label",
        "meta",
        "invalid",
        "deprecated",
        "text",
      ] as const;

      for (const type of tokenTypes) {
        const token: Token = { type, from: 0, to: 1 };
        expect(tokenClassName(token)).toBe(`teppan-token-${type}`);
      }
    });
  });
});
