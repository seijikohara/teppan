import { describe, expect, test } from "bun:test";
import {
  DEFAULT_BRACKET_PAIRS,
  createBracketState,
  findBracketAtCursor,
  findMatchingBracket,
  findMatchingCloseBracket,
  findMatchingOpenBracket,
  isClosingBracket,
  isInsideStringOrComment,
  isOpeningBracket,
} from "../bracket";

describe("bracket", () => {
  describe("isOpeningBracket", () => {
    test("returns pair for opening brackets", () => {
      expect(isOpeningBracket("(", DEFAULT_BRACKET_PAIRS)).toEqual({
        open: "(",
        close: ")",
      });
      expect(isOpeningBracket("[", DEFAULT_BRACKET_PAIRS)).toEqual({
        open: "[",
        close: "]",
      });
      expect(isOpeningBracket("{", DEFAULT_BRACKET_PAIRS)).toEqual({
        open: "{",
        close: "}",
      });
      expect(isOpeningBracket("<", DEFAULT_BRACKET_PAIRS)).toEqual({
        open: "<",
        close: ">",
      });
    });

    test("returns null for non-opening brackets", () => {
      expect(isOpeningBracket(")", DEFAULT_BRACKET_PAIRS)).toBeNull();
      expect(isOpeningBracket("]", DEFAULT_BRACKET_PAIRS)).toBeNull();
      expect(isOpeningBracket("a", DEFAULT_BRACKET_PAIRS)).toBeNull();
      expect(isOpeningBracket("", DEFAULT_BRACKET_PAIRS)).toBeNull();
    });
  });

  describe("isClosingBracket", () => {
    test("returns pair for closing brackets", () => {
      expect(isClosingBracket(")", DEFAULT_BRACKET_PAIRS)).toEqual({
        open: "(",
        close: ")",
      });
      expect(isClosingBracket("]", DEFAULT_BRACKET_PAIRS)).toEqual({
        open: "[",
        close: "]",
      });
      expect(isClosingBracket("}", DEFAULT_BRACKET_PAIRS)).toEqual({
        open: "{",
        close: "}",
      });
      expect(isClosingBracket(">", DEFAULT_BRACKET_PAIRS)).toEqual({
        open: "<",
        close: ">",
      });
    });

    test("returns null for non-closing brackets", () => {
      expect(isClosingBracket("(", DEFAULT_BRACKET_PAIRS)).toBeNull();
      expect(isClosingBracket("[", DEFAULT_BRACKET_PAIRS)).toBeNull();
      expect(isClosingBracket("a", DEFAULT_BRACKET_PAIRS)).toBeNull();
      expect(isClosingBracket("", DEFAULT_BRACKET_PAIRS)).toBeNull();
    });
  });

  describe("isInsideStringOrComment", () => {
    test("returns false for normal code", () => {
      expect(isInsideStringOrComment("const x = 1;", 6)).toBe(false);
      expect(isInsideStringOrComment("function foo() {}", 10)).toBe(false);
    });

    test("returns true inside double-quoted strings", () => {
      const doc = 'const x = "hello";';
      expect(isInsideStringOrComment(doc, 12)).toBe(true); // inside "hello"
      expect(isInsideStringOrComment(doc, 11)).toBe(true); // inside "hello"
      expect(isInsideStringOrComment(doc, 17)).toBe(false); // after string
    });

    test("returns true inside single-quoted strings", () => {
      const doc = "const x = 'hello';";
      expect(isInsideStringOrComment(doc, 12)).toBe(true); // inside 'hello'
      expect(isInsideStringOrComment(doc, 17)).toBe(false); // after string
    });

    test("returns true inside template strings", () => {
      const doc = "const x = `hello`;";
      expect(isInsideStringOrComment(doc, 12)).toBe(true); // inside `hello`
      expect(isInsideStringOrComment(doc, 17)).toBe(false); // after string
    });

    test("returns false inside line comments (before newline)", () => {
      const doc = "const x = 1; // comment\nconst y = 2;";
      expect(isInsideStringOrComment(doc, 18)).toBe(false); // inside comment but line comments aren't tracked for bracket matching
    });

    test("returns true inside block comments", () => {
      const doc = "const x = /* comment */ 1;";
      expect(isInsideStringOrComment(doc, 14)).toBe(true); // inside /* comment */
      expect(isInsideStringOrComment(doc, 24)).toBe(false); // after comment
    });

    test("handles escaped quotes", () => {
      const doc = 'const x = "hello\\"world";';
      expect(isInsideStringOrComment(doc, 18)).toBe(true); // still inside string after escaped quote
    });

    test("handles nested quotes in template strings", () => {
      const doc = 'const x = `he said "hi"`;';
      expect(isInsideStringOrComment(doc, 20)).toBe(true); // inside template string
    });
  });

  describe("findMatchingCloseBracket", () => {
    const pair = { open: "(", close: ")" };

    test("finds matching close bracket", () => {
      expect(
        findMatchingCloseBracket("()", 0, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(1);
      expect(
        findMatchingCloseBracket("(hello)", 0, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(6);
    });

    test("handles nested brackets", () => {
      expect(
        findMatchingCloseBracket("((()))", 0, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(5);
      expect(
        findMatchingCloseBracket("((()))", 1, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(4);
      expect(
        findMatchingCloseBracket("((()))", 2, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(3);
    });

    test("returns null for unmatched bracket", () => {
      expect(
        findMatchingCloseBracket("(", 0, pair, DEFAULT_BRACKET_PAIRS),
      ).toBeNull();
      expect(
        findMatchingCloseBracket("(()", 0, pair, DEFAULT_BRACKET_PAIRS),
      ).toBeNull();
    });

    test("ignores brackets inside strings", () => {
      const doc = '(")")';
      expect(
        findMatchingCloseBracket(doc, 0, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(4);
    });
  });

  describe("findMatchingOpenBracket", () => {
    const pair = { open: "(", close: ")" };

    test("finds matching open bracket", () => {
      expect(
        findMatchingOpenBracket("()", 1, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(0);
      expect(
        findMatchingOpenBracket("(hello)", 6, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(0);
    });

    test("handles nested brackets", () => {
      expect(
        findMatchingOpenBracket("((()))", 5, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(0);
      expect(
        findMatchingOpenBracket("((()))", 4, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(1);
      expect(
        findMatchingOpenBracket("((()))", 3, pair, DEFAULT_BRACKET_PAIRS),
      ).toBe(2);
    });

    test("returns null for unmatched bracket", () => {
      expect(
        findMatchingOpenBracket(")", 0, pair, DEFAULT_BRACKET_PAIRS),
      ).toBeNull();
      expect(
        findMatchingOpenBracket("())", 2, pair, DEFAULT_BRACKET_PAIRS),
      ).toBeNull();
    });

    test("ignores brackets inside strings", () => {
      const doc = '("(")';
      expect(findMatchingOpenBracket(doc, 4, pair, DEFAULT_BRACKET_PAIRS)).toBe(
        0,
      );
    });
  });

  describe("findMatchingBracket", () => {
    test("finds match for opening bracket", () => {
      const result = findMatchingBracket("(hello)", 0);
      expect(result).toEqual({ from: 0, to: 6, matched: true });
    });

    test("finds match for closing bracket", () => {
      const result = findMatchingBracket("(hello)", 6);
      expect(result).toEqual({ from: 6, to: 0, matched: true });
    });

    test("returns unmatched for unmatched opening bracket", () => {
      const result = findMatchingBracket("(hello", 0);
      expect(result).toEqual({ from: 0, to: -1, matched: false });
    });

    test("returns unmatched for unmatched closing bracket", () => {
      const result = findMatchingBracket("hello)", 5);
      expect(result).toEqual({ from: 5, to: -1, matched: false });
    });

    test("returns null for non-bracket character", () => {
      expect(findMatchingBracket("hello", 2)).toBeNull();
    });

    test("returns null for position inside string", () => {
      const doc = '"("';
      expect(findMatchingBracket(doc, 1)).toBeNull();
    });

    test("works with different bracket types", () => {
      expect(findMatchingBracket("[hello]", 0)).toEqual({
        from: 0,
        to: 6,
        matched: true,
      });
      expect(findMatchingBracket("{hello}", 0)).toEqual({
        from: 0,
        to: 6,
        matched: true,
      });
      expect(findMatchingBracket("<hello>", 0)).toEqual({
        from: 0,
        to: 6,
        matched: true,
      });
    });

    test("handles mixed bracket types", () => {
      const doc = "([{<>}])";
      expect(findMatchingBracket(doc, 0)).toEqual({
        from: 0,
        to: 7,
        matched: true,
      });
      expect(findMatchingBracket(doc, 1)).toEqual({
        from: 1,
        to: 6,
        matched: true,
      });
      expect(findMatchingBracket(doc, 2)).toEqual({
        from: 2,
        to: 5,
        matched: true,
      });
      expect(findMatchingBracket(doc, 3)).toEqual({
        from: 3,
        to: 4,
        matched: true,
      });
    });
  });

  describe("findBracketAtCursor", () => {
    test("finds bracket at cursor position", () => {
      const result = findBracketAtCursor("(hello)", 0);
      expect(result).toEqual({ from: 0, to: 6, matched: true });
    });

    test("finds bracket before cursor position", () => {
      const result = findBracketAtCursor("(hello)", 1);
      expect(result).toEqual({ from: 0, to: 6, matched: true });
    });

    test("finds closing bracket at cursor", () => {
      const result = findBracketAtCursor("(hello)", 6);
      expect(result).toEqual({ from: 6, to: 0, matched: true });
    });

    test("finds closing bracket before cursor (after closing bracket)", () => {
      const result = findBracketAtCursor("(hello)", 7);
      expect(result).toEqual({ from: 6, to: 0, matched: true });
    });

    test("returns null when no bracket near cursor", () => {
      expect(findBracketAtCursor("hello", 2)).toBeNull();
      expect(findBracketAtCursor("hello world", 6)).toBeNull();
    });

    test("handles cursor at beginning of document", () => {
      expect(findBracketAtCursor("()", 0)).toEqual({
        from: 0,
        to: 1,
        matched: true,
      });
    });

    test("handles cursor at end of document", () => {
      const result = findBracketAtCursor("()", 2);
      expect(result).toEqual({ from: 1, to: 0, matched: true });
    });
  });

  describe("createBracketState", () => {
    test("creates empty bracket state with default pairs", () => {
      const state = createBracketState();
      expect(state).toEqual({
        match: null,
        pairs: DEFAULT_BRACKET_PAIRS,
      });
    });

    test("creates bracket state with custom pairs", () => {
      const customPairs = [{ open: "(", close: ")" }];
      const state = createBracketState(customPairs);
      expect(state).toEqual({
        match: null,
        pairs: customPairs,
      });
    });
  });

  describe("DEFAULT_BRACKET_PAIRS", () => {
    test("contains standard bracket pairs", () => {
      expect(DEFAULT_BRACKET_PAIRS).toContainEqual({ open: "(", close: ")" });
      expect(DEFAULT_BRACKET_PAIRS).toContainEqual({ open: "[", close: "]" });
      expect(DEFAULT_BRACKET_PAIRS).toContainEqual({ open: "{", close: "}" });
      expect(DEFAULT_BRACKET_PAIRS).toContainEqual({ open: "<", close: ">" });
    });

    test("has 4 bracket pairs", () => {
      expect(DEFAULT_BRACKET_PAIRS).toHaveLength(4);
    });
  });
});
