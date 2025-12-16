import { describe, expect, test } from "bun:test";
import {
  CSS_VAR_PREFIX,
  type Theme,
  applyTheme,
  generateThemeCSS,
  mergeThemes,
  themeToCSSProperties,
} from "../theme";

// Minimal test theme
const minimalTheme: Theme = {
  name: "minimal",
  type: "dark",
  background: "#000000",
  foreground: "#ffffff",
};

// Full test theme
const fullTheme: Theme = {
  name: "full-theme",
  type: "light",
  background: "#ffffff",
  foreground: "#000000",
  lineHighlight: "#f0f0f0",
  activeLine: "#e0e0e0",
  matchingBracket: "#aabbcc",
  selection: {
    background: "#0066cc",
    foreground: "#ffffff",
    backgroundUnfocused: "#cccccc",
  },
  cursor: {
    color: "#ff0000",
    width: "3px",
    blink: true,
  },
  gutter: {
    background: "#f5f5f5",
    foreground: "#666666",
    border: "#dddddd",
    activeLineNumber: "#333333",
  },
  tokens: {
    comment: "#888888",
    keyword: "#0000ff",
    string: "#008800",
    number: "#ff8800",
    function: "#9900cc",
  },
  customProperties: {
    "--custom-prop": "#123456",
    "another-custom": "#654321",
  },
};

describe("CSS_VAR_PREFIX", () => {
  test("has expected value", () => {
    expect(CSS_VAR_PREFIX).toBe("--teppan");
  });
});

describe("themeToCSSProperties", () => {
  test("converts minimal theme", () => {
    const props = themeToCSSProperties(minimalTheme);

    expect(props["--teppan-bg"]).toBe("#000000");
    expect(props["--teppan-fg"]).toBe("#ffffff");
  });

  test("converts full theme background and foreground", () => {
    const props = themeToCSSProperties(fullTheme);

    expect(props["--teppan-bg"]).toBe("#ffffff");
    expect(props["--teppan-fg"]).toBe("#000000");
  });

  test("includes line highlight", () => {
    const props = themeToCSSProperties(fullTheme);
    expect(props["--teppan-line-highlight"]).toBe("#f0f0f0");
  });

  test("includes active line", () => {
    const props = themeToCSSProperties(fullTheme);
    expect(props["--teppan-active-line"]).toBe("#e0e0e0");
  });

  test("includes matching bracket", () => {
    const props = themeToCSSProperties(fullTheme);
    expect(props["--teppan-matching-bracket"]).toBe("#aabbcc");
  });

  test("includes selection styles", () => {
    const props = themeToCSSProperties(fullTheme);

    expect(props["--teppan-selection-bg"]).toBe("#0066cc");
    expect(props["--teppan-selection-fg"]).toBe("#ffffff");
    expect(props["--teppan-selection-bg-unfocused"]).toBe("#cccccc");
  });

  test("includes cursor styles", () => {
    const props = themeToCSSProperties(fullTheme);

    expect(props["--teppan-cursor-color"]).toBe("#ff0000");
    expect(props["--teppan-cursor-width"]).toBe("3px");
  });

  test("includes gutter styles", () => {
    const props = themeToCSSProperties(fullTheme);

    expect(props["--teppan-gutter-bg"]).toBe("#f5f5f5");
    expect(props["--teppan-gutter-fg"]).toBe("#666666");
    expect(props["--teppan-gutter-border"]).toBe("#dddddd");
    expect(props["--teppan-gutter-active"]).toBe("#333333");
  });

  test("includes token styles", () => {
    const props = themeToCSSProperties(fullTheme);

    expect(props["--teppan-token-comment"]).toBe("#888888");
    expect(props["--teppan-token-keyword"]).toBe("#0000ff");
    expect(props["--teppan-token-string"]).toBe("#008800");
    expect(props["--teppan-token-number"]).toBe("#ff8800");
    expect(props["--teppan-token-function"]).toBe("#9900cc");
  });

  test("includes custom properties with -- prefix", () => {
    const props = themeToCSSProperties(fullTheme);
    expect(props["--custom-prop"]).toBe("#123456");
  });

  test("adds -- prefix to custom properties without it", () => {
    const props = themeToCSSProperties(fullTheme);
    expect(props["--another-custom"]).toBe("#654321");
  });

  test("omits undefined optional properties", () => {
    const props = themeToCSSProperties(minimalTheme);

    expect(props["--teppan-line-highlight"]).toBeUndefined();
    expect(props["--teppan-active-line"]).toBeUndefined();
    expect(props["--teppan-selection-bg"]).toBeUndefined();
    expect(props["--teppan-cursor-color"]).toBeUndefined();
    expect(props["--teppan-gutter-bg"]).toBeUndefined();
  });

  test("handles theme with partial selection", () => {
    const theme: Theme = {
      ...minimalTheme,
      selection: { background: "#aabbcc" },
    };
    const props = themeToCSSProperties(theme);

    expect(props["--teppan-selection-bg"]).toBe("#aabbcc");
    expect(props["--teppan-selection-fg"]).toBeUndefined();
  });

  test("handles theme with partial cursor", () => {
    const theme: Theme = {
      ...minimalTheme,
      cursor: { color: "#ff0000" },
    };
    const props = themeToCSSProperties(theme);

    expect(props["--teppan-cursor-color"]).toBe("#ff0000");
    expect(props["--teppan-cursor-width"]).toBeUndefined();
  });

  test("handles theme with partial gutter", () => {
    const theme: Theme = {
      ...minimalTheme,
      gutter: { background: "#eeeeee" },
    };
    const props = themeToCSSProperties(theme);

    expect(props["--teppan-gutter-bg"]).toBe("#eeeeee");
    expect(props["--teppan-gutter-fg"]).toBeUndefined();
  });

  test("handles empty tokens", () => {
    const theme: Theme = {
      ...minimalTheme,
      tokens: {},
    };
    const props = themeToCSSProperties(theme);

    // Should not have any token properties
    const tokenProps = Object.keys(props).filter((k) => k.includes("-token-"));
    expect(tokenProps).toHaveLength(0);
  });
});

describe("applyTheme", () => {
  test("applies CSS properties to element", () => {
    // Create mock element
    const styleProps: Record<string, string> = {};
    const dataset: Record<string, string> = {};
    const element = {
      style: {
        setProperty: (key: string, value: string) => {
          styleProps[key] = value;
        },
      },
      dataset,
    } as unknown as HTMLElement;

    applyTheme(element, minimalTheme);

    expect(styleProps["--teppan-bg"]).toBe("#000000");
    expect(styleProps["--teppan-fg"]).toBe("#ffffff");
  });

  test("sets data attributes for theme type and name", () => {
    const dataset: Record<string, string> = {};
    const element = {
      style: { setProperty: () => {} },
      dataset,
    } as unknown as HTMLElement;

    applyTheme(element, fullTheme);

    expect(dataset.themeType).toBe("light");
    expect(dataset.themeName).toBe("full-theme");
  });
});

describe("generateThemeCSS", () => {
  test("generates CSS with theme selector", () => {
    const css = generateThemeCSS(minimalTheme);

    expect(css).toContain('.teppan-editor[data-theme-name="minimal"]');
    expect(css).toContain("--teppan-bg: #000000");
    expect(css).toContain("--teppan-fg: #ffffff");
  });

  test("generates CSS with proper formatting", () => {
    const css = generateThemeCSS(minimalTheme);
    const lines = css.split("\n");

    // First line is selector
    expect(lines[0]).toBe('.teppan-editor[data-theme-name="minimal"] {');
    // Last line is closing brace
    expect(lines[lines.length - 1]).toBe("}");
    // Properties are indented
    expect(lines.some((l) => l.startsWith("  --teppan-"))).toBe(true);
  });

  test("includes all CSS properties for full theme", () => {
    const css = generateThemeCSS(fullTheme);

    expect(css).toContain("--teppan-bg: #ffffff");
    expect(css).toContain("--teppan-fg: #000000");
    expect(css).toContain("--teppan-selection-bg: #0066cc");
    expect(css).toContain("--teppan-cursor-color: #ff0000");
    expect(css).toContain("--teppan-gutter-bg: #f5f5f5");
    expect(css).toContain("--teppan-token-keyword: #0000ff");
  });
});

describe("mergeThemes", () => {
  test("overrides base properties", () => {
    const merged = mergeThemes(minimalTheme, {
      background: "#111111",
    });

    expect(merged.background).toBe("#111111");
    expect(merged.foreground).toBe("#ffffff"); // unchanged
    expect(merged.name).toBe("minimal"); // unchanged
  });

  test("overrides name", () => {
    const merged = mergeThemes(minimalTheme, {
      name: "modified-minimal",
    });

    expect(merged.name).toBe("modified-minimal");
  });

  test("overrides type", () => {
    const merged = mergeThemes(minimalTheme, {
      type: "light",
    });

    expect(merged.type).toBe("light");
  });

  test("merges selection styles", () => {
    const base: Theme = {
      ...minimalTheme,
      selection: { background: "#aaa", foreground: "#bbb" },
    };
    const merged = mergeThemes(base, {
      selection: { background: "#ccc" },
    });

    expect(merged.selection?.background).toBe("#ccc");
    expect(merged.selection?.foreground).toBe("#bbb"); // preserved
  });

  test("merges cursor styles", () => {
    const base: Theme = {
      ...minimalTheme,
      cursor: { color: "#red", width: "2px" },
    };
    const merged = mergeThemes(base, {
      cursor: { color: "#blue" },
    });

    expect(merged.cursor?.color).toBe("#blue");
    expect(merged.cursor?.width).toBe("2px"); // preserved
  });

  test("merges gutter styles", () => {
    const base: Theme = {
      ...minimalTheme,
      gutter: { background: "#fff", foreground: "#000" },
    };
    const merged = mergeThemes(base, {
      gutter: { foreground: "#333" },
    });

    expect(merged.gutter?.background).toBe("#fff"); // preserved
    expect(merged.gutter?.foreground).toBe("#333");
  });

  test("merges token styles", () => {
    const base: Theme = {
      ...minimalTheme,
      tokens: { keyword: "#blue", comment: "#gray" },
    };
    const merged = mergeThemes(base, {
      tokens: { keyword: "#red", string: "#green" },
    });

    expect(merged.tokens?.keyword).toBe("#red"); // overridden
    expect(merged.tokens?.comment).toBe("#gray"); // preserved
    expect(merged.tokens?.string).toBe("#green"); // added
  });

  test("merges custom properties", () => {
    const base: Theme = {
      ...minimalTheme,
      customProperties: { "--a": "1", "--b": "2" },
    };
    const merged = mergeThemes(base, {
      customProperties: { "--b": "3", "--c": "4" },
    });

    expect(merged.customProperties?.["--a"]).toBe("1"); // preserved
    expect(merged.customProperties?.["--b"]).toBe("3"); // overridden
    expect(merged.customProperties?.["--c"]).toBe("4"); // added
  });

  test("handles undefined nested properties", () => {
    const merged = mergeThemes(minimalTheme, {
      selection: { background: "#aaa" },
    });

    expect(merged.selection?.background).toBe("#aaa");
  });

  test("preserves all base properties", () => {
    const merged = mergeThemes(fullTheme, {});

    expect(merged.name).toBe(fullTheme.name);
    expect(merged.type).toBe(fullTheme.type);
    expect(merged.background).toBe(fullTheme.background);
    expect(merged.selection?.background).toBe(fullTheme.selection?.background);
    expect(merged.tokens?.keyword).toBe(fullTheme.tokens?.keyword);
  });
});
