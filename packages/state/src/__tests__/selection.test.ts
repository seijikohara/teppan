import { describe, expect, test } from "bun:test";
import { createPosition } from "../position";
import { SelectionRange, SelectionSet } from "../selection";

describe("SelectionRange", () => {
  describe("cursor", () => {
    test("creates collapsed selection at position", () => {
      const pos = createPosition(5, 10);
      const range = SelectionRange.cursor(pos);
      expect(range.anchor).toEqual(pos);
      expect(range.head).toEqual(pos);
      expect(range.isEmpty).toBe(true);
    });
  });

  describe("range", () => {
    test("creates selection from anchor to head", () => {
      const anchor = createPosition(1, 0);
      const head = createPosition(1, 10);
      const range = SelectionRange.range(anchor, head);
      expect(range.anchor).toEqual(anchor);
      expect(range.head).toEqual(head);
      expect(range.isEmpty).toBe(false);
    });
  });

  describe("from/to", () => {
    test("returns correct order when anchor before head", () => {
      const anchor = createPosition(1, 0);
      const head = createPosition(1, 10);
      const range = SelectionRange.range(anchor, head);
      expect(range.from).toEqual(anchor);
      expect(range.to).toEqual(head);
    });

    test("returns correct order when head before anchor", () => {
      const anchor = createPosition(1, 10);
      const head = createPosition(1, 0);
      const range = SelectionRange.range(anchor, head);
      expect(range.from).toEqual(head);
      expect(range.to).toEqual(anchor);
    });
  });

  describe("range getter", () => {
    test("returns normalized range", () => {
      const anchor = createPosition(2, 5);
      const head = createPosition(1, 0);
      const range = SelectionRange.range(anchor, head);
      const normalized = range.range;
      expect(normalized.start).toEqual(head);
      expect(normalized.end).toEqual(anchor);
    });
  });

  describe("isEmpty", () => {
    test("returns true for cursor", () => {
      const range = SelectionRange.cursor(createPosition(0, 0));
      expect(range.isEmpty).toBe(true);
    });

    test("returns false for non-empty selection", () => {
      const range = SelectionRange.range(
        createPosition(0, 0),
        createPosition(0, 5),
      );
      expect(range.isEmpty).toBe(false);
    });
  });

  describe("extend", () => {
    test("creates new selection with same anchor and new head", () => {
      const anchor = createPosition(1, 0);
      const head = createPosition(1, 5);
      const range = SelectionRange.range(anchor, head);

      const newHead = createPosition(1, 15);
      const extended = range.extend(newHead);

      expect(extended.anchor).toEqual(anchor);
      expect(extended.head).toEqual(newHead);
    });
  });

  describe("map", () => {
    test("applies mapping function to anchor and head", () => {
      const range = SelectionRange.range(
        createPosition(1, 5),
        createPosition(1, 10),
      );

      const mapped = range.map((pos) => ({
        line: pos.line + 1,
        column: pos.column + 2,
      }));

      expect(mapped.anchor).toEqual(createPosition(2, 7));
      expect(mapped.head).toEqual(createPosition(2, 12));
    });
  });

  describe("equals", () => {
    test("returns true for equal ranges", () => {
      const a = SelectionRange.range(
        createPosition(1, 5),
        createPosition(1, 10),
      );
      const b = SelectionRange.range(
        createPosition(1, 5),
        createPosition(1, 10),
      );
      expect(a.equals(b)).toBe(true);
    });

    test("returns false for different anchors", () => {
      const a = SelectionRange.range(
        createPosition(1, 5),
        createPosition(1, 10),
      );
      const b = SelectionRange.range(
        createPosition(1, 6),
        createPosition(1, 10),
      );
      expect(a.equals(b)).toBe(false);
    });

    test("returns false for different heads", () => {
      const a = SelectionRange.range(
        createPosition(1, 5),
        createPosition(1, 10),
      );
      const b = SelectionRange.range(
        createPosition(1, 5),
        createPosition(1, 11),
      );
      expect(a.equals(b)).toBe(false);
    });
  });
});

describe("SelectionSet", () => {
  describe("constructor", () => {
    test("creates set with ranges", () => {
      const ranges = [
        SelectionRange.cursor(createPosition(0, 0)),
        SelectionRange.cursor(createPosition(1, 0)),
      ];
      const set = new SelectionSet(ranges);
      expect(set.ranges).toHaveLength(2);
      expect(set.mainIndex).toBe(0);
    });

    test("throws for empty ranges", () => {
      expect(() => new SelectionSet([])).toThrow(
        "SelectionSet must have at least one range",
      );
    });

    test("clamps mainIndex to valid range", () => {
      const ranges = [SelectionRange.cursor(createPosition(0, 0))];
      const set = new SelectionSet(ranges, 10);
      expect(set.mainIndex).toBe(0);
    });
  });

  describe("cursor", () => {
    test("creates set with single cursor", () => {
      const pos = createPosition(5, 10);
      const set = SelectionSet.cursor(pos);
      expect(set.ranges).toHaveLength(1);
      expect(set.main.head).toEqual(pos);
      expect(set.main.isEmpty).toBe(true);
    });
  });

  describe("single", () => {
    test("creates set with single range", () => {
      const anchor = createPosition(1, 0);
      const head = createPosition(1, 10);
      const set = SelectionSet.single(anchor, head);
      expect(set.ranges).toHaveLength(1);
      expect(set.main.anchor).toEqual(anchor);
      expect(set.main.head).toEqual(head);
    });
  });

  describe("main", () => {
    test("returns the main selection", () => {
      const ranges = [
        SelectionRange.cursor(createPosition(0, 0)),
        SelectionRange.cursor(createPosition(1, 5)),
        SelectionRange.cursor(createPosition(2, 10)),
      ];
      const set = new SelectionSet(ranges, 1);
      expect(set.main).toBe(ranges[1]);
    });
  });

  describe("isEmpty", () => {
    test("returns true when all ranges are cursors", () => {
      const set = new SelectionSet([
        SelectionRange.cursor(createPosition(0, 0)),
        SelectionRange.cursor(createPosition(1, 0)),
      ]);
      expect(set.isEmpty).toBe(true);
    });

    test("returns false when any range is not empty", () => {
      const set = new SelectionSet([
        SelectionRange.cursor(createPosition(0, 0)),
        SelectionRange.range(createPosition(1, 0), createPosition(1, 5)),
      ]);
      expect(set.isEmpty).toBe(false);
    });
  });

  describe("map", () => {
    test("maps all ranges and preserves mainIndex", () => {
      const set = new SelectionSet(
        [
          SelectionRange.cursor(createPosition(0, 0)),
          SelectionRange.cursor(createPosition(1, 0)),
        ],
        1,
      );

      const mapped = set.map((pos) => ({
        line: pos.line + 1,
        column: pos.column + 5,
      }));

      expect(mapped.ranges[0]!.head).toEqual(createPosition(1, 5));
      expect(mapped.ranges[1]!.head).toEqual(createPosition(2, 5));
      expect(mapped.mainIndex).toBe(1);
    });
  });

  describe("replaceMain", () => {
    test("replaces main selection preserving others", () => {
      const set = new SelectionSet(
        [
          SelectionRange.cursor(createPosition(0, 0)),
          SelectionRange.cursor(createPosition(1, 0)),
        ],
        1,
      );

      const newMain = SelectionRange.cursor(createPosition(5, 5));
      const updated = set.replaceMain(newMain);

      expect(updated.ranges[0]!.head).toEqual(createPosition(0, 0));
      expect(updated.ranges[1]!.head).toEqual(createPosition(5, 5));
      expect(updated.mainIndex).toBe(1);
    });
  });

  describe("addRange", () => {
    test("adds range and sets as main by default", () => {
      const set = SelectionSet.cursor(createPosition(0, 0));
      const newRange = SelectionRange.cursor(createPosition(5, 5));
      const updated = set.addRange(newRange);

      expect(updated.ranges).toHaveLength(2);
      expect(updated.mainIndex).toBe(1);
      expect(updated.main).toEqual(newRange);
    });

    test("adds range without changing main when main=false", () => {
      const set = SelectionSet.cursor(createPosition(0, 0));
      const newRange = SelectionRange.cursor(createPosition(5, 5));
      const updated = set.addRange(newRange, false);

      expect(updated.ranges).toHaveLength(2);
      expect(updated.mainIndex).toBe(0);
    });
  });

  describe("equals", () => {
    test("returns true for equal sets", () => {
      const a = new SelectionSet(
        [
          SelectionRange.cursor(createPosition(0, 0)),
          SelectionRange.cursor(createPosition(1, 5)),
        ],
        1,
      );
      const b = new SelectionSet(
        [
          SelectionRange.cursor(createPosition(0, 0)),
          SelectionRange.cursor(createPosition(1, 5)),
        ],
        1,
      );
      expect(a.equals(b)).toBe(true);
    });

    test("returns false for different range counts", () => {
      const a = new SelectionSet([SelectionRange.cursor(createPosition(0, 0))]);
      const b = new SelectionSet([
        SelectionRange.cursor(createPosition(0, 0)),
        SelectionRange.cursor(createPosition(1, 0)),
      ]);
      expect(a.equals(b)).toBe(false);
    });

    test("returns false for different mainIndex", () => {
      const ranges = [
        SelectionRange.cursor(createPosition(0, 0)),
        SelectionRange.cursor(createPosition(1, 0)),
      ];
      const a = new SelectionSet(ranges, 0);
      const b = new SelectionSet(ranges, 1);
      expect(a.equals(b)).toBe(false);
    });

    test("returns false for different ranges", () => {
      const a = new SelectionSet([SelectionRange.cursor(createPosition(0, 0))]);
      const b = new SelectionSet([SelectionRange.cursor(createPosition(0, 1))]);
      expect(a.equals(b)).toBe(false);
    });
  });
});
