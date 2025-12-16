import { describe, expect, test } from "bun:test";
import {
  comparePositions,
  createPosition,
  createRange,
  isRangeEmpty,
  positionsEqual,
  rangeContains,
  rangesOverlap,
} from "../position";

describe("Position", () => {
  describe("createPosition", () => {
    test("creates position with line and column", () => {
      const pos = createPosition(5, 10);
      expect(pos.line).toBe(5);
      expect(pos.column).toBe(10);
    });

    test("creates position at origin", () => {
      const pos = createPosition(0, 0);
      expect(pos.line).toBe(0);
      expect(pos.column).toBe(0);
    });
  });

  describe("comparePositions", () => {
    test("returns negative when a is before b (different line)", () => {
      const a = createPosition(1, 5);
      const b = createPosition(2, 3);
      expect(comparePositions(a, b)).toBeLessThan(0);
    });

    test("returns negative when a is before b (same line)", () => {
      const a = createPosition(1, 3);
      const b = createPosition(1, 5);
      expect(comparePositions(a, b)).toBeLessThan(0);
    });

    test("returns positive when a is after b (different line)", () => {
      const a = createPosition(3, 0);
      const b = createPosition(2, 10);
      expect(comparePositions(a, b)).toBeGreaterThan(0);
    });

    test("returns positive when a is after b (same line)", () => {
      const a = createPosition(1, 10);
      const b = createPosition(1, 5);
      expect(comparePositions(a, b)).toBeGreaterThan(0);
    });

    test("returns zero when positions are equal", () => {
      const a = createPosition(5, 10);
      const b = createPosition(5, 10);
      expect(comparePositions(a, b)).toBe(0);
    });
  });

  describe("positionsEqual", () => {
    test("returns true for equal positions", () => {
      const a = createPosition(5, 10);
      const b = createPosition(5, 10);
      expect(positionsEqual(a, b)).toBe(true);
    });

    test("returns false for different lines", () => {
      const a = createPosition(5, 10);
      const b = createPosition(6, 10);
      expect(positionsEqual(a, b)).toBe(false);
    });

    test("returns false for different columns", () => {
      const a = createPosition(5, 10);
      const b = createPosition(5, 11);
      expect(positionsEqual(a, b)).toBe(false);
    });
  });
});

describe("Range", () => {
  describe("createRange", () => {
    test("creates range with start before end", () => {
      const start = createPosition(1, 0);
      const end = createPosition(1, 10);
      const range = createRange(start, end);
      expect(range.start).toEqual(start);
      expect(range.end).toEqual(end);
    });

    test("normalizes range when start is after end", () => {
      const start = createPosition(2, 5);
      const end = createPosition(1, 0);
      const range = createRange(start, end);
      expect(range.start).toEqual(end);
      expect(range.end).toEqual(start);
    });
  });

  describe("isRangeEmpty", () => {
    test("returns true for collapsed range", () => {
      const pos = createPosition(5, 10);
      const range = createRange(pos, pos);
      expect(isRangeEmpty(range)).toBe(true);
    });

    test("returns false for non-empty range", () => {
      const start = createPosition(5, 10);
      const end = createPosition(5, 15);
      const range = createRange(start, end);
      expect(isRangeEmpty(range)).toBe(false);
    });
  });

  describe("rangeContains", () => {
    test("returns true for position inside range", () => {
      const range = createRange(createPosition(1, 0), createPosition(1, 10));
      const pos = createPosition(1, 5);
      expect(rangeContains(range, pos)).toBe(true);
    });

    test("returns true for position at start", () => {
      const range = createRange(createPosition(1, 0), createPosition(1, 10));
      const pos = createPosition(1, 0);
      expect(rangeContains(range, pos)).toBe(true);
    });

    test("returns false for position at end (exclusive)", () => {
      const range = createRange(createPosition(1, 0), createPosition(1, 10));
      const pos = createPosition(1, 10);
      expect(rangeContains(range, pos)).toBe(false);
    });

    test("returns false for position before range", () => {
      const range = createRange(createPosition(2, 0), createPosition(2, 10));
      const pos = createPosition(1, 5);
      expect(rangeContains(range, pos)).toBe(false);
    });

    test("returns false for position after range", () => {
      const range = createRange(createPosition(1, 0), createPosition(1, 10));
      const pos = createPosition(2, 0);
      expect(rangeContains(range, pos)).toBe(false);
    });
  });

  describe("rangesOverlap", () => {
    test("returns true for overlapping ranges", () => {
      const a = createRange(createPosition(1, 0), createPosition(1, 10));
      const b = createRange(createPosition(1, 5), createPosition(1, 15));
      expect(rangesOverlap(a, b)).toBe(true);
    });

    test("returns true for contained range", () => {
      const a = createRange(createPosition(1, 0), createPosition(1, 20));
      const b = createRange(createPosition(1, 5), createPosition(1, 15));
      expect(rangesOverlap(a, b)).toBe(true);
    });

    test("returns false for adjacent ranges (no overlap)", () => {
      const a = createRange(createPosition(1, 0), createPosition(1, 10));
      const b = createRange(createPosition(1, 10), createPosition(1, 20));
      expect(rangesOverlap(a, b)).toBe(false);
    });

    test("returns false for separate ranges", () => {
      const a = createRange(createPosition(1, 0), createPosition(1, 5));
      const b = createRange(createPosition(1, 10), createPosition(1, 15));
      expect(rangesOverlap(a, b)).toBe(false);
    });

    test("returns false for ranges on different lines", () => {
      const a = createRange(createPosition(1, 0), createPosition(1, 10));
      const b = createRange(createPosition(2, 0), createPosition(2, 10));
      expect(rangesOverlap(a, b)).toBe(false);
    });
  });
});
