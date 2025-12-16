import { describe, expect, test } from "bun:test";
import { Change, ChangeSet } from "../changeset";

describe("Change", () => {
  describe("constructor", () => {
    test("creates change with from, to, and insert", () => {
      const change = new Change(5, 10, "hello");
      expect(change.from).toBe(5);
      expect(change.to).toBe(10);
      expect(change.insert).toBe("hello");
    });
  });

  describe("insert", () => {
    test("creates insertion at offset", () => {
      const change = Change.insert(5, "hello");
      expect(change.from).toBe(5);
      expect(change.to).toBe(5);
      expect(change.insert).toBe("hello");
    });
  });

  describe("delete", () => {
    test("creates deletion with empty insert", () => {
      const change = Change.delete(5, 10);
      expect(change.from).toBe(5);
      expect(change.to).toBe(10);
      expect(change.insert).toBe("");
    });
  });

  describe("replace", () => {
    test("creates replacement", () => {
      const change = Change.replace(5, 10, "new");
      expect(change.from).toBe(5);
      expect(change.to).toBe(10);
      expect(change.insert).toBe("new");
    });
  });

  describe("deleteLength", () => {
    test("returns correct delete length", () => {
      const change = new Change(5, 15, "");
      expect(change.deleteLength).toBe(10);
    });

    test("returns 0 for pure insertion", () => {
      const change = Change.insert(5, "hello");
      expect(change.deleteLength).toBe(0);
    });
  });

  describe("insertLength", () => {
    test("returns correct insert length", () => {
      const change = Change.insert(5, "hello");
      expect(change.insertLength).toBe(5);
    });

    test("returns 0 for pure deletion", () => {
      const change = Change.delete(5, 10);
      expect(change.insertLength).toBe(0);
    });
  });

  describe("lengthDelta", () => {
    test("positive for insertion", () => {
      const change = Change.insert(5, "hello");
      expect(change.lengthDelta).toBe(5);
    });

    test("negative for deletion", () => {
      const change = Change.delete(5, 10);
      expect(change.lengthDelta).toBe(-5);
    });

    test("calculates correctly for replacement", () => {
      const change = Change.replace(5, 10, "hi"); // delete 5, insert 2
      expect(change.lengthDelta).toBe(-3);
    });
  });

  describe("isInsertion", () => {
    test("returns true for pure insertion", () => {
      const change = Change.insert(5, "hello");
      expect(change.isInsertion).toBe(true);
    });

    test("returns false for deletion", () => {
      const change = Change.delete(5, 10);
      expect(change.isInsertion).toBe(false);
    });

    test("returns false for replacement", () => {
      const change = Change.replace(5, 10, "hello");
      expect(change.isInsertion).toBe(false);
    });
  });

  describe("isDeletion", () => {
    test("returns true for pure deletion", () => {
      const change = Change.delete(5, 10);
      expect(change.isDeletion).toBe(true);
    });

    test("returns false for insertion", () => {
      const change = Change.insert(5, "hello");
      expect(change.isDeletion).toBe(false);
    });

    test("returns false for replacement", () => {
      const change = Change.replace(5, 10, "hello");
      expect(change.isDeletion).toBe(false);
    });
  });

  describe("isEmpty", () => {
    test("returns true for no-op change", () => {
      const change = new Change(5, 5, "");
      expect(change.isEmpty).toBe(true);
    });

    test("returns false for insertion", () => {
      const change = Change.insert(5, "x");
      expect(change.isEmpty).toBe(false);
    });

    test("returns false for deletion", () => {
      const change = Change.delete(5, 6);
      expect(change.isEmpty).toBe(false);
    });
  });
});

describe("ChangeSet", () => {
  describe("empty", () => {
    test("creates empty change set", () => {
      const cs = ChangeSet.empty(100);
      expect(cs.isEmpty).toBe(true);
      expect(cs.originalLength).toBe(100);
      expect(cs.newLength).toBe(100);
    });
  });

  describe("of", () => {
    test("creates change set from single change", () => {
      const change = Change.insert(0, "hello");
      const cs = ChangeSet.of(change, 0);
      expect(cs.changes).toHaveLength(1);
      expect(cs.changes[0]).toBe(change);
    });
  });

  describe("isEmpty", () => {
    test("returns true for empty set", () => {
      const cs = ChangeSet.empty(100);
      expect(cs.isEmpty).toBe(true);
    });

    test("returns false for non-empty set", () => {
      const cs = ChangeSet.of(Change.insert(0, "x"), 0);
      expect(cs.isEmpty).toBe(false);
    });
  });

  describe("newLength", () => {
    test("calculates new length after insertion", () => {
      const cs = ChangeSet.of(Change.insert(0, "hello"), 10);
      expect(cs.newLength).toBe(15);
    });

    test("calculates new length after deletion", () => {
      const cs = ChangeSet.of(Change.delete(0, 5), 10);
      expect(cs.newLength).toBe(5);
    });

    test("calculates new length with multiple changes", () => {
      const cs = new ChangeSet(
        [Change.insert(0, "ab"), Change.delete(5, 8)],
        10
      );
      expect(cs.newLength).toBe(10 + 2 - 3); // 9
    });
  });

  describe("mapOffset", () => {
    test("maps offset before change unchanged", () => {
      const cs = ChangeSet.of(Change.insert(10, "hello"), 20);
      expect(cs.mapOffset(5)).toBe(5);
    });

    test("maps offset after insertion", () => {
      const cs = ChangeSet.of(Change.insert(5, "hello"), 20);
      expect(cs.mapOffset(10)).toBe(15); // shifted by 5
    });

    test("maps offset after deletion", () => {
      const cs = ChangeSet.of(Change.delete(5, 10), 20);
      expect(cs.mapOffset(15)).toBe(10); // shifted by -5
    });

    test("maps offset at insertion point with assoc=1 (default)", () => {
      const cs = ChangeSet.of(Change.insert(5, "hello"), 20);
      expect(cs.mapOffset(5, 1)).toBe(10); // after inserted text
    });

    test("maps offset at insertion point with assoc=-1", () => {
      const cs = ChangeSet.of(Change.insert(5, "hello"), 20);
      expect(cs.mapOffset(5, -1)).toBe(5); // before inserted text
    });

    test("maps offset inside deleted region with assoc=1", () => {
      const cs = ChangeSet.of(Change.delete(5, 15), 20);
      expect(cs.mapOffset(10, 1)).toBe(5); // to end of deleted region
    });

    test("maps offset inside deleted region with assoc=-1", () => {
      const cs = ChangeSet.of(Change.delete(5, 15), 20);
      expect(cs.mapOffset(10, -1)).toBe(5); // to start of deleted region
    });
  });

  describe("compose", () => {
    test("returns other when this is empty", () => {
      const empty = ChangeSet.empty(10);
      const other = ChangeSet.of(Change.insert(0, "x"), 10);
      const composed = empty.compose(other);
      expect(composed).toBe(other);
    });

    test("returns this when other is empty", () => {
      const cs = ChangeSet.of(Change.insert(0, "x"), 10);
      const empty = ChangeSet.empty(11);
      const composed = cs.compose(empty);
      expect(composed).toBe(cs);
    });

    test("composes two insertions", () => {
      const first = ChangeSet.of(Change.insert(0, "ab"), 10);
      const second = ChangeSet.of(Change.insert(2, "cd"), 12);
      const composed = first.compose(second);
      expect(composed.changes).toHaveLength(2);
      expect(composed.originalLength).toBe(10);
    });
  });

  describe("invert", () => {
    test("inverts insertion to deletion", () => {
      const originalDoc = "hello world";
      const cs = ChangeSet.of(Change.insert(5, " there"), originalDoc.length);
      const inverted = cs.invert(originalDoc);

      expect(inverted.changes).toHaveLength(1);
      const change = inverted.changes[0]!;
      expect(change.from).toBe(5);
      expect(change.to).toBe(5 + 6); // original insert length
      expect(change.insert).toBe(""); // deletes the inserted text
    });

    test("inverts deletion to insertion", () => {
      const originalDoc = "hello world";
      const cs = ChangeSet.of(Change.delete(5, 11), originalDoc.length);
      const inverted = cs.invert(originalDoc);

      expect(inverted.changes).toHaveLength(1);
      const change = inverted.changes[0]!;
      expect(change.from).toBe(5);
      expect(change.to).toBe(5); // no deletion in inverted
      expect(change.insert).toBe(" world"); // restores deleted text
    });

    test("inverts replacement", () => {
      const originalDoc = "hello world";
      const cs = ChangeSet.of(
        Change.replace(6, 11, "there"),
        originalDoc.length
      );
      const inverted = cs.invert(originalDoc);

      expect(inverted.changes).toHaveLength(1);
      const change = inverted.changes[0]!;
      expect(change.from).toBe(6);
      expect(change.to).toBe(6 + 5); // "there".length
      expect(change.insert).toBe("world"); // restores original text
    });
  });

  describe("iterator", () => {
    test("iterates over changes", () => {
      const changes = [
        Change.insert(0, "a"),
        Change.insert(5, "b"),
        Change.insert(10, "c"),
      ];
      const cs = new ChangeSet(changes, 15);

      const collected: Change[] = [];
      for (const change of cs) {
        collected.push(change);
      }

      expect(collected).toEqual(changes);
    });
  });
});
