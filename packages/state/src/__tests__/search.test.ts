import { describe, expect, test } from "bun:test";
import {
  buildSearchRegex,
  createSearchState,
  findMatches,
  findNearestMatch,
} from "../search";

describe("search", () => {
  describe("buildSearchRegex", () => {
    test("returns null for empty search string", () => {
      const regex = buildSearchRegex({ search: "" });
      expect(regex).toBeNull();
    });

    test("creates case-insensitive regex by default", () => {
      const regex = buildSearchRegex({ search: "hello" });
      expect(regex).not.toBeNull();
      expect(regex!.flags).toContain("i");
      expect(regex!.flags).toContain("g");
    });

    test("creates case-sensitive regex when specified", () => {
      const regex = buildSearchRegex({ search: "Hello", caseSensitive: true });
      expect(regex).not.toBeNull();
      expect(regex!.flags).not.toContain("i");
      expect(regex!.flags).toContain("g");
    });

    test("escapes special regex characters for literal search", () => {
      const regex = buildSearchRegex({ search: "foo.bar*baz" });
      expect(regex).not.toBeNull();
      expect(regex!.test("foo.bar*baz")).toBe(true);
      expect(regex!.test("fooXbarYbaz")).toBe(false);
    });

    test("does not escape characters when regexp mode is enabled", () => {
      const regex = buildSearchRegex({ search: "foo.*bar", regexp: true });
      expect(regex).not.toBeNull();
      // Note: test() with 'g' flag modifies lastIndex, so we use separate regex instances or reset
      expect(regex!.test("foobar")).toBe(true);
      regex!.lastIndex = 0;
      expect(regex!.test("foo123bar")).toBe(true);
    });

    test("adds word boundaries when wholeWord is true", () => {
      const regex = buildSearchRegex({ search: "test", wholeWord: true });
      expect(regex).not.toBeNull();
      expect(regex!.test("test")).toBe(true);
      expect(regex!.test("testing")).toBe(false);
      expect(regex!.test("a test here")).toBe(true);
    });

    test("returns null for invalid regex pattern", () => {
      const regex = buildSearchRegex({ search: "[invalid", regexp: true });
      expect(regex).toBeNull();
    });
  });

  describe("findMatches", () => {
    const doc = "hello world, hello universe";

    test("finds all matches", () => {
      const matches = findMatches(doc, { search: "hello" });
      expect(matches).toHaveLength(2);
      expect(matches[0]).toEqual({ from: 0, to: 5, match: "hello" });
      expect(matches[1]).toEqual({ from: 13, to: 18, match: "hello" });
    });

    test("returns empty array for no matches", () => {
      const matches = findMatches(doc, { search: "goodbye" });
      expect(matches).toHaveLength(0);
    });

    test("returns empty array for empty search", () => {
      const matches = findMatches(doc, { search: "" });
      expect(matches).toHaveLength(0);
    });

    test("respects case sensitivity", () => {
      const matches1 = findMatches("Hello hello HELLO", { search: "hello" });
      expect(matches1).toHaveLength(3);

      const matches2 = findMatches("Hello hello HELLO", {
        search: "hello",
        caseSensitive: true,
      });
      expect(matches2).toHaveLength(1);
      expect(matches2[0]).toEqual({ from: 6, to: 11, match: "hello" });
    });

    test("respects whole word matching", () => {
      const matches1 = findMatches("test testing tested", { search: "test" });
      expect(matches1).toHaveLength(3);

      const matches2 = findMatches("test testing tested", {
        search: "test",
        wholeWord: true,
      });
      expect(matches2).toHaveLength(1);
      expect(matches2[0]).toEqual({ from: 0, to: 4, match: "test" });
    });

    test("supports regex search", () => {
      const matches = findMatches("cat bat rat mat", {
        search: "[cbr]at",
        regexp: true,
      });
      expect(matches).toHaveLength(3);
      expect(matches.map((m) => m.match)).toEqual(["cat", "bat", "rat"]);
    });

    test("handles zero-length matches", () => {
      const matches = findMatches("abc", { search: "^", regexp: true });
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ from: 0, to: 0, match: "" });
    });
  });

  describe("findNearestMatch", () => {
    const matches = [
      { from: 0, to: 5, match: "hello" },
      { from: 10, to: 15, match: "hello" },
      { from: 20, to: 25, match: "hello" },
    ];

    test("returns -1 for empty matches", () => {
      expect(findNearestMatch([], 0, "forward")).toBe(-1);
    });

    test("finds next match forward", () => {
      expect(findNearestMatch(matches, 0, "forward")).toBe(0);
      expect(findNearestMatch(matches, 5, "forward")).toBe(1);
      expect(findNearestMatch(matches, 15, "forward")).toBe(2);
    });

    test("wraps around forward", () => {
      expect(findNearestMatch(matches, 25, "forward")).toBe(0);
      expect(findNearestMatch(matches, 100, "forward")).toBe(0);
    });

    test("finds previous match backward", () => {
      expect(findNearestMatch(matches, 25, "backward")).toBe(2);
      expect(findNearestMatch(matches, 15, "backward")).toBe(1);
      expect(findNearestMatch(matches, 10, "backward")).toBe(0);
    });

    test("wraps around backward", () => {
      expect(findNearestMatch(matches, 0, "backward")).toBe(2);
    });
  });

  describe("createSearchState", () => {
    test("creates empty search state", () => {
      const state = createSearchState();
      expect(state).toEqual({
        query: null,
        matches: [],
        currentMatchIndex: -1,
      });
    });
  });
});
