import { describe, expect, test } from "bun:test";
import { defaultDark } from "../default-dark";
import { defaultLight } from "../default-light";
import type { Theme } from "../theme";

describe("defaultDark", () => {
  test("has correct name", () => {
    expect(defaultDark.name).toBe("default-dark");
  });

  test("has dark type", () => {
    expect(defaultDark.type).toBe("dark");
  });

  test("has background color", () => {
    expect(defaultDark.background).toBeDefined();
    expect(typeof defaultDark.background).toBe("string");
    expect(defaultDark.background).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("has foreground color", () => {
    expect(defaultDark.foreground).toBeDefined();
    expect(typeof defaultDark.foreground).toBe("string");
    expect(defaultDark.foreground).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("has line highlight", () => {
    expect(defaultDark.lineHighlight).toBeDefined();
  });

  test("has active line", () => {
    expect(defaultDark.activeLine).toBeDefined();
  });

  test("has matching bracket", () => {
    expect(defaultDark.matchingBracket).toBeDefined();
  });

  test("has selection styles", () => {
    expect(defaultDark.selection).toBeDefined();
    expect(defaultDark.selection?.background).toBeDefined();
    expect(defaultDark.selection?.backgroundUnfocused).toBeDefined();
  });

  test("has cursor styles", () => {
    expect(defaultDark.cursor).toBeDefined();
    expect(defaultDark.cursor?.color).toBeDefined();
    expect(defaultDark.cursor?.width).toBeDefined();
  });

  test("has gutter styles", () => {
    expect(defaultDark.gutter).toBeDefined();
    expect(defaultDark.gutter?.background).toBeDefined();
    expect(defaultDark.gutter?.foreground).toBeDefined();
    expect(defaultDark.gutter?.border).toBeDefined();
  });

  test("has token styles", () => {
    expect(defaultDark.tokens).toBeDefined();
    expect(defaultDark.tokens?.comment).toBeDefined();
    expect(defaultDark.tokens?.keyword).toBeDefined();
    expect(defaultDark.tokens?.string).toBeDefined();
    expect(defaultDark.tokens?.number).toBeDefined();
    expect(defaultDark.tokens?.function).toBeDefined();
    expect(defaultDark.tokens?.variable).toBeDefined();
    expect(defaultDark.tokens?.type).toBeDefined();
    expect(defaultDark.tokens?.class).toBeDefined();
    expect(defaultDark.tokens?.property).toBeDefined();
    expect(defaultDark.tokens?.punctuation).toBeDefined();
    expect(defaultDark.tokens?.regexp).toBeDefined();
    expect(defaultDark.tokens?.constant).toBeDefined();
    expect(defaultDark.tokens?.boolean).toBeDefined();
    expect(defaultDark.tokens?.null).toBeDefined();
    expect(defaultDark.tokens?.tag).toBeDefined();
    expect(defaultDark.tokens?.attribute).toBeDefined();
    expect(defaultDark.tokens?.namespace).toBeDefined();
    expect(defaultDark.tokens?.label).toBeDefined();
    expect(defaultDark.tokens?.meta).toBeDefined();
    expect(defaultDark.tokens?.invalid).toBeDefined();
    expect(defaultDark.tokens?.deprecated).toBeDefined();
  });

  test("satisfies Theme interface", () => {
    const theme: Theme = defaultDark;
    expect(theme).toBeDefined();
  });
});

describe("defaultLight", () => {
  test("has correct name", () => {
    expect(defaultLight.name).toBe("default-light");
  });

  test("has light type", () => {
    expect(defaultLight.type).toBe("light");
  });

  test("has background color", () => {
    expect(defaultLight.background).toBeDefined();
    expect(typeof defaultLight.background).toBe("string");
    expect(defaultLight.background).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("has foreground color", () => {
    expect(defaultLight.foreground).toBeDefined();
    expect(typeof defaultLight.foreground).toBe("string");
    expect(defaultLight.foreground).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("has line highlight", () => {
    expect(defaultLight.lineHighlight).toBeDefined();
  });

  test("has active line", () => {
    expect(defaultLight.activeLine).toBeDefined();
  });

  test("has matching bracket", () => {
    expect(defaultLight.matchingBracket).toBeDefined();
  });

  test("has selection styles", () => {
    expect(defaultLight.selection).toBeDefined();
    expect(defaultLight.selection?.background).toBeDefined();
    expect(defaultLight.selection?.backgroundUnfocused).toBeDefined();
  });

  test("has cursor styles", () => {
    expect(defaultLight.cursor).toBeDefined();
    expect(defaultLight.cursor?.color).toBeDefined();
    expect(defaultLight.cursor?.width).toBeDefined();
  });

  test("has gutter styles", () => {
    expect(defaultLight.gutter).toBeDefined();
    expect(defaultLight.gutter?.background).toBeDefined();
    expect(defaultLight.gutter?.foreground).toBeDefined();
    expect(defaultLight.gutter?.border).toBeDefined();
  });

  test("has token styles", () => {
    expect(defaultLight.tokens).toBeDefined();
    expect(defaultLight.tokens?.comment).toBeDefined();
    expect(defaultLight.tokens?.keyword).toBeDefined();
    expect(defaultLight.tokens?.string).toBeDefined();
    expect(defaultLight.tokens?.number).toBeDefined();
    expect(defaultLight.tokens?.function).toBeDefined();
    expect(defaultLight.tokens?.variable).toBeDefined();
    expect(defaultLight.tokens?.type).toBeDefined();
    expect(defaultLight.tokens?.class).toBeDefined();
    expect(defaultLight.tokens?.property).toBeDefined();
    expect(defaultLight.tokens?.punctuation).toBeDefined();
    expect(defaultLight.tokens?.regexp).toBeDefined();
    expect(defaultLight.tokens?.constant).toBeDefined();
    expect(defaultLight.tokens?.boolean).toBeDefined();
    expect(defaultLight.tokens?.null).toBeDefined();
    expect(defaultLight.tokens?.tag).toBeDefined();
    expect(defaultLight.tokens?.attribute).toBeDefined();
    expect(defaultLight.tokens?.namespace).toBeDefined();
    expect(defaultLight.tokens?.label).toBeDefined();
    expect(defaultLight.tokens?.meta).toBeDefined();
    expect(defaultLight.tokens?.invalid).toBeDefined();
    expect(defaultLight.tokens?.deprecated).toBeDefined();
  });

  test("satisfies Theme interface", () => {
    const theme: Theme = defaultLight;
    expect(theme).toBeDefined();
  });
});

describe("dark vs light theme comparison", () => {
  test("themes have different names", () => {
    expect(defaultDark.name).not.toBe(defaultLight.name);
  });

  test("themes have different types", () => {
    expect(defaultDark.type).not.toBe(defaultLight.type);
  });

  test("themes have different backgrounds", () => {
    expect(defaultDark.background).not.toBe(defaultLight.background);
  });

  test("themes have different foregrounds", () => {
    expect(defaultDark.foreground).not.toBe(defaultLight.foreground);
  });

  test("themes have different token colors", () => {
    // Most syntax colors should differ between light and dark themes
    expect(defaultDark.tokens?.keyword).not.toBe(defaultLight.tokens?.keyword);
    expect(defaultDark.tokens?.string).not.toBe(defaultLight.tokens?.string);
    expect(defaultDark.tokens?.comment).not.toBe(defaultLight.tokens?.comment);
  });

  test("both themes have complete token coverage", () => {
    const darkTokenKeys = Object.keys(defaultDark.tokens || {});
    const lightTokenKeys = Object.keys(defaultLight.tokens || {});

    expect(darkTokenKeys.length).toBe(lightTokenKeys.length);
    expect(darkTokenKeys.sort()).toEqual(lightTokenKeys.sort());
  });
});
