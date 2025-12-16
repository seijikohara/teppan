import { describe, expect, test } from "bun:test";
import {
  DecorationSet,
  DecorationBuilder,
  builder,
  lineDecoration,
  rangeDecoration,
  widgetDecoration,
  collectDecorations,
} from "../decoration";
import type { Decoration, EditorState } from "@teppan/state";

describe("DecorationSet", () => {
  describe("empty", () => {
    test("creates empty set", () => {
      const set = DecorationSet.empty();
      expect(set.isEmpty).toBe(true);
      expect(set.all).toEqual([]);
    });
  });

  describe("of", () => {
    test("creates set from array", () => {
      const decorations: Decoration[] = [
        { type: "line", line: 0, class: "highlight" },
        { type: "range", from: 0, to: 5, class: "token" },
      ];
      const set = DecorationSet.of(decorations);

      expect(set.isEmpty).toBe(false);
      expect(set.all).toHaveLength(2);
    });

    test("creates empty set from empty array", () => {
      const set = DecorationSet.of([]);
      expect(set.isEmpty).toBe(true);
    });
  });

  describe("getForLine", () => {
    test("returns line decorations for specific line", () => {
      const decorations: Decoration[] = [
        { type: "line", line: 0, class: "line0" },
        { type: "line", line: 1, class: "line1" },
        { type: "line", line: 2, class: "line2" },
        { type: "range", from: 0, to: 10, class: "range" },
      ];
      const set = DecorationSet.of(decorations);

      const line1Decs = set.getForLine(1);
      expect(line1Decs).toHaveLength(1);
      expect(line1Decs[0].class).toBe("line1");
    });

    test("returns empty array when no line decorations", () => {
      const decorations: Decoration[] = [
        { type: "range", from: 0, to: 10, class: "range" },
      ];
      const set = DecorationSet.of(decorations);

      expect(set.getForLine(0)).toEqual([]);
    });
  });

  describe("getForRange", () => {
    test("returns range decorations overlapping with range", () => {
      const decorations: Decoration[] = [
        { type: "range", from: 0, to: 5, class: "range1" },
        { type: "range", from: 10, to: 15, class: "range2" },
        { type: "range", from: 3, to: 8, class: "range3" },
        { type: "line", line: 0, class: "line" },
      ];
      const set = DecorationSet.of(decorations);

      const overlapping = set.getForRange(2, 7);
      expect(overlapping).toHaveLength(2);
      expect(overlapping.map((d) => d.class).sort()).toEqual([
        "range1",
        "range3",
      ]);
    });

    test("excludes non-overlapping ranges", () => {
      const decorations: Decoration[] = [
        { type: "range", from: 0, to: 5, class: "range1" },
        { type: "range", from: 10, to: 15, class: "range2" },
      ];
      const set = DecorationSet.of(decorations);

      expect(set.getForRange(6, 9)).toEqual([]);
    });

    test("includes ranges that just touch", () => {
      const decorations: Decoration[] = [
        { type: "range", from: 0, to: 5, class: "range1" },
      ];
      const set = DecorationSet.of(decorations);

      // Range ends at 5, we query from 4 to 6
      const overlapping = set.getForRange(4, 6);
      expect(overlapping).toHaveLength(1);
    });
  });

  describe("getWidgetsAt", () => {
    test("returns widget decorations at offset", () => {
      const decorations: Decoration[] = [
        { type: "widget", from: 5, class: "widget1" },
        { type: "widget", from: 10, class: "widget2" },
        { type: "widget", from: 5, class: "widget3" },
        { type: "range", from: 5, to: 10, class: "range" },
      ];
      const set = DecorationSet.of(decorations);

      const widgets = set.getWidgetsAt(5);
      expect(widgets).toHaveLength(2);
      expect(widgets.map((d) => d.class).sort()).toEqual([
        "widget1",
        "widget3",
      ]);
    });

    test("returns empty for no widgets at offset", () => {
      const set = DecorationSet.of([
        { type: "widget", from: 5, class: "widget" },
      ]);
      expect(set.getWidgetsAt(0)).toEqual([]);
    });
  });

  describe("add", () => {
    test("adds decorations to set", () => {
      const set1 = DecorationSet.of([
        { type: "line", line: 0, class: "line0" },
      ]);
      const set2 = set1.add([{ type: "line", line: 1, class: "line1" }]);

      expect(set1.all).toHaveLength(1); // Original unchanged
      expect(set2.all).toHaveLength(2);
    });
  });

  describe("filter", () => {
    test("filters decorations by predicate", () => {
      const decorations: Decoration[] = [
        { type: "line", line: 0, class: "line0" },
        { type: "range", from: 0, to: 5, class: "range" },
        { type: "line", line: 1, class: "line1" },
      ];
      const set = DecorationSet.of(decorations);

      const filtered = set.filter((d) => d.type === "line");
      expect(filtered.all).toHaveLength(2);
      expect(filtered.all.every((d) => d.type === "line")).toBe(true);
    });
  });
});

describe("lineDecoration", () => {
  test("creates line decoration", () => {
    const dec = lineDecoration(5, { class: "highlight" });

    expect(dec.type).toBe("line");
    expect(dec.line).toBe(5);
    expect(dec.class).toBe("highlight");
  });

  test("creates line decoration with attributes", () => {
    const dec = lineDecoration(0, {
      class: "special",
      attributes: { "data-id": "123" },
    });

    expect(dec.attributes).toEqual({ "data-id": "123" });
  });
});

describe("rangeDecoration", () => {
  test("creates range decoration", () => {
    const dec = rangeDecoration(10, 20, { class: "token-keyword" });

    expect(dec.type).toBe("range");
    expect(dec.from).toBe(10);
    expect(dec.to).toBe(20);
    expect(dec.class).toBe("token-keyword");
  });

  test("creates range decoration with attributes", () => {
    const dec = rangeDecoration(0, 5, {
      attributes: { title: "Error" },
    });

    expect(dec.attributes).toEqual({ title: "Error" });
  });
});

describe("widgetDecoration", () => {
  test("creates widget decoration", () => {
    const dec = widgetDecoration(15, { class: "icon" });

    expect(dec.type).toBe("widget");
    expect(dec.from).toBe(15);
    expect(dec.class).toBe("icon");
  });
});

describe("DecorationBuilder", () => {
  test("builds decorations fluently", () => {
    const set = new DecorationBuilder()
      .line(0, { class: "active" })
      .range(0, 5, { class: "keyword" })
      .widget(10, { class: "icon" })
      .build();

    expect(set.all).toHaveLength(3);
  });

  test("builder function creates builder", () => {
    const b = builder();
    expect(b).toBeInstanceOf(DecorationBuilder);
  });

  test("can build empty set", () => {
    const set = builder().build();
    expect(set.isEmpty).toBe(true);
  });
});

describe("collectDecorations", () => {
  test("collects decorations from providers", () => {
    const mockState = {
      decorationProviders: [
        () => [{ type: "line" as const, line: 0, class: "a" }],
        () => [{ type: "line" as const, line: 1, class: "b" }],
      ],
    } as unknown as EditorState;

    const set = collectDecorations(mockState);
    expect(set.all).toHaveLength(2);
  });

  test("returns empty set when no providers", () => {
    const mockState = {
      decorationProviders: [],
    } as unknown as EditorState;

    const set = collectDecorations(mockState);
    expect(set.isEmpty).toBe(true);
  });

  test("combines all provider results", () => {
    const mockState = {
      decorationProviders: [
        () => [
          { type: "line" as const, line: 0, class: "a" },
          { type: "line" as const, line: 1, class: "b" },
        ],
        () => [{ type: "range" as const, from: 0, to: 5, class: "c" }],
      ],
    } as unknown as EditorState;

    const set = collectDecorations(mockState);
    expect(set.all).toHaveLength(3);
  });
});
