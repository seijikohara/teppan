import { describe, expect, test } from "bun:test";
import { createPosition } from "../position";
import { SelectionSet } from "../selection";
import { EditorState } from "../state";

describe("EditorState", () => {
  describe("create", () => {
    test("creates empty state by default", () => {
      const state = EditorState.create();
      expect(state.doc).toBe("");
      expect(state.length).toBe(0);
      expect(state.lineCount).toBe(1);
    });

    test("creates state with initial document", () => {
      const state = EditorState.create({ doc: "hello world" });
      expect(state.doc).toBe("hello world");
      expect(state.length).toBe(11);
    });

    test("creates state with initial selection", () => {
      const selection = SelectionSet.cursor(createPosition(0, 5));
      const state = EditorState.create({ doc: "hello world", selection });
      expect(state.selection.main.head).toEqual(createPosition(0, 5));
    });

    test("creates state with default selection at origin", () => {
      const state = EditorState.create({ doc: "hello" });
      expect(state.selection.main.head).toEqual(createPosition(0, 0));
      expect(state.selection.main.isEmpty).toBe(true);
    });
  });

  describe("length", () => {
    test("returns document length", () => {
      const state = EditorState.create({ doc: "hello world" });
      expect(state.length).toBe(11);
    });

    test("returns 0 for empty document", () => {
      const state = EditorState.create();
      expect(state.length).toBe(0);
    });
  });

  describe("lineCount", () => {
    test("returns 1 for single line", () => {
      const state = EditorState.create({ doc: "hello world" });
      expect(state.lineCount).toBe(1);
    });

    test("returns correct count for multiple lines", () => {
      const state = EditorState.create({ doc: "line1\nline2\nline3" });
      expect(state.lineCount).toBe(3);
    });

    test("returns 1 for empty document", () => {
      const state = EditorState.create();
      expect(state.lineCount).toBe(1);
    });

    test("handles trailing newline", () => {
      const state = EditorState.create({ doc: "line1\nline2\n" });
      expect(state.lineCount).toBe(3);
    });
  });

  describe("line", () => {
    test("returns line info for valid line number", () => {
      const state = EditorState.create({ doc: "hello\nworld\nfoo" });
      const line = state.line(1);
      expect(line).not.toBeUndefined();
      expect(line!.text).toBe("world");
      expect(line!.from).toBe(6);
      expect(line!.to).toBe(11);
    });

    test("returns undefined for negative line number", () => {
      const state = EditorState.create({ doc: "hello" });
      expect(state.line(-1)).toBeUndefined();
    });

    test("returns undefined for out of range line number", () => {
      const state = EditorState.create({ doc: "hello" });
      expect(state.line(10)).toBeUndefined();
    });

    test("returns first line info correctly", () => {
      const state = EditorState.create({ doc: "hello\nworld" });
      const line = state.line(0);
      expect(line!.text).toBe("hello");
      expect(line!.from).toBe(0);
      expect(line!.to).toBe(5);
    });
  });

  describe("sliceDoc", () => {
    test("returns substring of document", () => {
      const state = EditorState.create({ doc: "hello world" });
      expect(state.sliceDoc(0, 5)).toBe("hello");
      expect(state.sliceDoc(6, 11)).toBe("world");
    });

    test("returns rest of document when to is undefined", () => {
      const state = EditorState.create({ doc: "hello world" });
      expect(state.sliceDoc(6)).toBe("world");
    });
  });

  describe("positionToOffset", () => {
    test("converts position to offset for single line", () => {
      const state = EditorState.create({ doc: "hello world" });
      expect(state.positionToOffset({ line: 0, column: 0 })).toBe(0);
      expect(state.positionToOffset({ line: 0, column: 5 })).toBe(5);
      expect(state.positionToOffset({ line: 0, column: 11 })).toBe(11);
    });

    test("converts position to offset for multiple lines", () => {
      const state = EditorState.create({ doc: "hello\nworld\nfoo" });
      expect(state.positionToOffset({ line: 0, column: 0 })).toBe(0);
      expect(state.positionToOffset({ line: 1, column: 0 })).toBe(6);
      expect(state.positionToOffset({ line: 1, column: 3 })).toBe(9);
      expect(state.positionToOffset({ line: 2, column: 0 })).toBe(12);
    });

    test("clamps column to line length", () => {
      const state = EditorState.create({ doc: "hello\nworld" });
      expect(state.positionToOffset({ line: 0, column: 100 })).toBe(5);
    });

    test("clamps offset to document length", () => {
      const state = EditorState.create({ doc: "hello" });
      expect(state.positionToOffset({ line: 10, column: 0 })).toBe(5);
    });
  });

  describe("offsetToPosition", () => {
    test("converts offset to position for single line", () => {
      const state = EditorState.create({ doc: "hello world" });
      expect(state.offsetToPosition(0)).toEqual({ line: 0, column: 0 });
      expect(state.offsetToPosition(5)).toEqual({ line: 0, column: 5 });
      expect(state.offsetToPosition(11)).toEqual({ line: 0, column: 11 });
    });

    test("converts offset to position for multiple lines", () => {
      const state = EditorState.create({ doc: "hello\nworld\nfoo" });
      expect(state.offsetToPosition(0)).toEqual({ line: 0, column: 0 });
      expect(state.offsetToPosition(6)).toEqual({ line: 1, column: 0 });
      expect(state.offsetToPosition(9)).toEqual({ line: 1, column: 3 });
      expect(state.offsetToPosition(12)).toEqual({ line: 2, column: 0 });
    });

    test("clamps negative offset to 0", () => {
      const state = EditorState.create({ doc: "hello" });
      expect(state.offsetToPosition(-5)).toEqual({ line: 0, column: 0 });
    });

    test("clamps offset beyond document length", () => {
      const state = EditorState.create({ doc: "hello" });
      expect(state.offsetToPosition(100)).toEqual({ line: 0, column: 5 });
    });
  });

  describe("transaction", () => {
    test("creates transaction from state", () => {
      const state = EditorState.create({ doc: "hello" });
      const tr = state.transaction({
        changes: { from: 5, insert: " world" },
      });
      expect(tr.docChanged).toBe(true);
    });
  });

  describe("apply", () => {
    test("applies insertion transaction", () => {
      const state = EditorState.create({ doc: "hello" });
      const tr = state.transaction({
        changes: { from: 5, insert: " world" },
      });
      const newState = state.apply(tr);
      expect(newState.doc).toBe("hello world");
    });

    test("applies deletion transaction", () => {
      const state = EditorState.create({ doc: "hello world" });
      const tr = state.transaction({
        changes: { from: 5, to: 11, insert: "" },
      });
      const newState = state.apply(tr);
      expect(newState.doc).toBe("hello");
    });

    test("applies replacement transaction", () => {
      const state = EditorState.create({ doc: "hello world" });
      const tr = state.transaction({
        changes: { from: 6, to: 11, insert: "there" },
      });
      const newState = state.apply(tr);
      expect(newState.doc).toBe("hello there");
    });

    test("applies selection change", () => {
      const state = EditorState.create({ doc: "hello" });
      const newSelection = SelectionSet.cursor(createPosition(0, 3));
      const tr = state.transaction({ selection: newSelection });
      const newState = state.apply(tr);
      expect(newState.selection.main.head).toEqual(createPosition(0, 3));
    });

    test("updates selection with explicit selection in transaction", () => {
      const state = EditorState.create({
        doc: "hello",
        selection: SelectionSet.cursor(createPosition(0, 0)),
      });
      const tr = state.transaction({
        changes: { from: 5, insert: " world" },
        selection: SelectionSet.cursor(createPosition(0, 11)),
      });
      const newState = state.apply(tr);
      expect(newState.selection.main.head).toEqual(createPosition(0, 11));
    });

    test("returns same state when transaction has no changes", () => {
      const state = EditorState.create({ doc: "hello" });
      const tr = state.transaction({});
      const newState = state.apply(tr);
      expect(newState.doc).toBe("hello");
    });

    test("handles multiple changes correctly", () => {
      const state = EditorState.create({ doc: "hello world" });
      const tr = state.transaction({
        changes: [
          { from: 0, to: 5, insert: "hi" },
          { from: 6, to: 11, insert: "there" },
        ],
      });
      const newState = state.apply(tr);
      expect(newState.doc).toBe("hi there");
    });
  });
});
