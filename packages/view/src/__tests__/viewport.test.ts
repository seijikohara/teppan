import { beforeEach, describe, expect, test } from "bun:test";
import type { EditorState } from "@teppan/state";
import { type Viewport, ViewportManager, getVisibleLines } from "../viewport";

describe("ViewportManager", () => {
  let viewport: ViewportManager;

  beforeEach(() => {
    viewport = new ViewportManager({
      lineHeight: 20,
      overscan: 2,
      paddingTop: 10,
      paddingBottom: 10,
    });
    viewport.setLineCount(100);
    viewport.setContainerHeight(200);
  });

  describe("constructor", () => {
    test("uses default config when no options provided", () => {
      const v = new ViewportManager();
      expect(v.lineHeight).toBe(20); // default
    });

    test("accepts custom config", () => {
      const v = new ViewportManager({ lineHeight: 24 });
      expect(v.lineHeight).toBe(24);
    });
  });

  describe("setContainerHeight", () => {
    test("updates container height", () => {
      viewport.setContainerHeight(300);
      const vp = viewport.getViewport();
      // With height 300, we should see more lines
      expect(vp.to - vp.from).toBeGreaterThan(10);
    });
  });

  describe("setScrollTop", () => {
    test("updates scroll position", () => {
      viewport.setScrollTop(100);
      const vp = viewport.getViewport();
      expect(vp.top).toBe(100);
    });
  });

  describe("setLineCount", () => {
    test("updates line count", () => {
      viewport.setLineCount(50);
      const height = viewport.getTotalHeight();
      // 50 lines * 20px + 10 padding top + 10 padding bottom = 1020
      expect(height).toBe(1020);
    });
  });

  describe("getViewport", () => {
    test("returns viewport at scroll position 0", () => {
      viewport.setScrollTop(0);
      const vp = viewport.getViewport();

      expect(vp.from).toBe(0);
      expect(vp.top).toBe(0);
      // With 200px container, 20px lines, we see ~10 lines + 2 overscan
      expect(vp.to).toBeGreaterThanOrEqual(10);
    });

    test("calculates visible lines with scroll", () => {
      viewport.setScrollTop(200); // Scroll down 10 lines worth
      const vp = viewport.getViewport();

      // Should start around line 8 (10 - 2 overscan)
      expect(vp.from).toBeGreaterThanOrEqual(5);
      expect(vp.from).toBeLessThan(15);
    });

    test("respects overscan", () => {
      viewport.setScrollTop(100);
      const vp = viewport.getViewport();

      // Should include lines before visible area due to overscan
      const exactFirstVisible = Math.floor(100 / 20);
      expect(vp.from).toBeLessThanOrEqual(exactFirstVisible);
    });

    test("clamps to valid line range", () => {
      viewport.setScrollTop(0);
      const vp = viewport.getViewport();

      expect(vp.from).toBeGreaterThanOrEqual(0);
      expect(vp.to).toBeLessThanOrEqual(100);
    });
  });

  describe("getTotalHeight", () => {
    test("calculates total content height", () => {
      viewport.setLineCount(100);
      const height = viewport.getTotalHeight();

      // 100 lines * 20px + 10 padding + 10 padding = 2020
      expect(height).toBe(2020);
    });

    test("includes padding in total height", () => {
      const v = new ViewportManager({
        lineHeight: 20,
        paddingTop: 50,
        paddingBottom: 50,
      });
      v.setLineCount(10);

      // 10 * 20 + 50 + 50 = 300
      expect(v.getTotalHeight()).toBe(300);
    });
  });

  describe("getLineTop", () => {
    test("calculates line top position", () => {
      expect(viewport.getLineTop(0)).toBe(10); // paddingTop
      expect(viewport.getLineTop(1)).toBe(30); // 10 + 20
      expect(viewport.getLineTop(5)).toBe(110); // 10 + 5*20
    });

    test("includes padding", () => {
      const v = new ViewportManager({
        lineHeight: 20,
        paddingTop: 100,
      });
      expect(v.getLineTop(0)).toBe(100);
    });
  });

  describe("getLineAtY", () => {
    test("returns line number at y position", () => {
      expect(viewport.getLineAtY(10)).toBe(0); // at paddingTop
      expect(viewport.getLineAtY(30)).toBe(1); // 10 + 20
      expect(viewport.getLineAtY(25)).toBe(0); // still in first line
    });

    test("clamps to valid range", () => {
      expect(viewport.getLineAtY(-100)).toBe(0);
      expect(viewport.getLineAtY(10000)).toBe(99); // lineCount - 1
    });

    test("accounts for padding", () => {
      expect(viewport.getLineAtY(0)).toBe(0); // before padding still returns 0
      expect(viewport.getLineAtY(9)).toBe(0);
      expect(viewport.getLineAtY(10)).toBe(0);
      expect(viewport.getLineAtY(29)).toBe(0);
      expect(viewport.getLineAtY(30)).toBe(1);
    });
  });

  describe("isLineVisible", () => {
    test("returns true for visible lines", () => {
      viewport.setScrollTop(0);
      expect(viewport.isLineVisible(0)).toBe(true);
      expect(viewport.isLineVisible(5)).toBe(true);
    });

    test("returns false for lines outside viewport", () => {
      viewport.setScrollTop(0);
      expect(viewport.isLineVisible(50)).toBe(false);
      expect(viewport.isLineVisible(99)).toBe(false);
    });

    test("accounts for scroll position", () => {
      viewport.setScrollTop(500);
      expect(viewport.isLineVisible(0)).toBe(false);
      expect(viewport.isLineVisible(25)).toBe(true);
    });
  });

  describe("scrollToLine", () => {
    test("scrolls to start of line", () => {
      const scroll = viewport.scrollToLine(10, "start");
      // Line 10 top = 10 + 10*20 = 210, minus paddingTop 10 = 200
      expect(scroll).toBe(200);
    });

    test("scrolls to center line", () => {
      const scroll = viewport.scrollToLine(10, "center");
      // Line top = 210, center = 210 - 100 + 10 = 120
      expect(scroll).toBe(120);
    });

    test("scrolls to end of line", () => {
      const scroll = viewport.scrollToLine(10, "end");
      // Line bottom = 210 + 20 = 230, minus container 200 + padding 10 = 40
      expect(scroll).toBe(40);
    });

    test("nearest keeps current position if visible", () => {
      viewport.setScrollTop(200);
      // Line 10 at 210 is visible with container at 200-400
      const scroll = viewport.scrollToLine(10, "nearest");
      expect(scroll).toBe(200); // no change needed
    });

    test("nearest scrolls up if line is above", () => {
      viewport.setScrollTop(500);
      const scroll = viewport.scrollToLine(10, "nearest");
      expect(scroll).toBe(200); // scroll up to show line
    });

    test("nearest scrolls down if line is below", () => {
      viewport.setScrollTop(0);
      const scroll = viewport.scrollToLine(50, "nearest");
      // Line 50 bottom at 1020, scroll to show it
      expect(scroll).toBeGreaterThan(0);
    });
  });

  describe("setLineHeight", () => {
    test("updates line height", () => {
      viewport.setLineHeight(30);
      expect(viewport.lineHeight).toBe(30);
    });

    test("affects viewport calculations", () => {
      viewport.setLineHeight(40);
      const height = viewport.getTotalHeight();
      // 100 * 40 + 10 + 10 = 4020
      expect(height).toBe(4020);
    });
  });

  describe("updateFromState", () => {
    test("updates line count from state", () => {
      const mockState = { lineCount: 50 } as EditorState;
      viewport.updateFromState(mockState);

      const height = viewport.getTotalHeight();
      expect(height).toBe(1020); // 50 * 20 + 10 + 10
    });
  });
});

describe("getVisibleLines", () => {
  test("returns visible lines for viewport", () => {
    const mockState = {
      line: (n: number) =>
        n >= 0 && n < 10
          ? { text: `line ${n}`, from: n * 10, to: n * 10 + 5 }
          : undefined,
    } as unknown as EditorState;

    const vp: Viewport = { from: 2, to: 5, top: 0 };
    const lines = getVisibleLines(mockState, vp);

    expect(lines).toHaveLength(3);
    expect(lines[0]!.lineNumber).toBe(2);
    expect(lines[0]!.text).toBe("line 2");
    expect(lines[1]!.lineNumber).toBe(3);
    expect(lines[2]!.lineNumber).toBe(4);
  });

  test("handles viewport beyond document", () => {
    const mockState = {
      line: (n: number) =>
        n >= 0 && n < 3
          ? { text: `line ${n}`, from: n * 10, to: n * 10 + 5 }
          : undefined,
    } as unknown as EditorState;

    const vp: Viewport = { from: 0, to: 10, top: 0 };
    const lines = getVisibleLines(mockState, vp);

    // Only 3 lines exist
    expect(lines).toHaveLength(3);
  });

  test("returns empty for empty viewport", () => {
    const mockState = {
      line: () => undefined,
    } as unknown as EditorState;

    const vp: Viewport = { from: 0, to: 0, top: 0 };
    const lines = getVisibleLines(mockState, vp);

    expect(lines).toHaveLength(0);
  });

  test("includes correct from/to offsets", () => {
    const mockState = {
      line: (n: number) =>
        n === 0
          ? { text: "hello", from: 0, to: 5 }
          : n === 1
            ? { text: "world", from: 6, to: 11 }
            : undefined,
    } as unknown as EditorState;

    const vp: Viewport = { from: 0, to: 2, top: 0 };
    const lines = getVisibleLines(mockState, vp);

    expect(lines[0]!.from).toBe(0);
    expect(lines[0]!.to).toBe(5);
    expect(lines[1]!.from).toBe(6);
    expect(lines[1]!.to).toBe(11);
  });
});
