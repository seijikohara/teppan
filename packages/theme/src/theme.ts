/**
 * Token styles for syntax highlighting
 */
export interface TokenStyles {
  /** Comments */
  comment?: string;
  /** Keywords (if, else, for, etc.) */
  keyword?: string;
  /** String literals */
  string?: string;
  /** Number literals */
  number?: string;
  /** Operators (+, -, *, etc.) */
  operator?: string;
  /** Function names */
  function?: string;
  /** Variable names */
  variable?: string;
  /** Type names */
  type?: string;
  /** Class names */
  class?: string;
  /** Property names */
  property?: string;
  /** Punctuation (brackets, commas, etc.) */
  punctuation?: string;
  /** Regular expressions */
  regexp?: string;
  /** Constants */
  constant?: string;
  /** Boolean values */
  boolean?: string;
  /** Null/undefined */
  null?: string;
  /** Tags (HTML, JSX) */
  tag?: string;
  /** Attributes (HTML, JSX) */
  attribute?: string;
  /** Namespace/module names */
  namespace?: string;
  /** Labels */
  label?: string;
  /** Meta/annotation */
  meta?: string;
  /** Invalid/error */
  invalid?: string;
  /** Deprecated */
  deprecated?: string;
}

/**
 * Gutter styling
 */
export interface GutterStyles {
  /** Gutter background color */
  background?: string;
  /** Gutter text color */
  foreground?: string;
  /** Border color (between gutter and content) */
  border?: string;
  /** Active line number color */
  activeLineNumber?: string;
}

/**
 * Selection styling
 */
export interface SelectionStyles {
  /** Selection background color */
  background?: string;
  /** Selection text color (if different from normal) */
  foreground?: string;
  /** Selection background when editor not focused */
  backgroundUnfocused?: string;
}

/**
 * Cursor styling
 */
export interface CursorStyles {
  /** Cursor color */
  color?: string;
  /** Cursor width */
  width?: string;
  /** Cursor blink animation */
  blink?: boolean;
}

/**
 * Theme definition
 */
export interface Theme {
  /** Theme name */
  name: string;
  /** Theme type (light or dark) */
  type: "light" | "dark";

  /** Editor background color */
  background: string;
  /** Editor text color */
  foreground: string;
  /** Line highlight color */
  lineHighlight?: string;
  /** Active line background */
  activeLine?: string;
  /** Matching bracket highlight */
  matchingBracket?: string;

  /** Selection styles */
  selection?: SelectionStyles;
  /** Cursor styles */
  cursor?: CursorStyles;
  /** Gutter styles */
  gutter?: GutterStyles;

  /** Token styles for syntax highlighting */
  tokens?: TokenStyles;

  /** Custom CSS variables */
  customProperties?: Record<string, string>;
}

/**
 * CSS variable prefix for theme properties
 */
export const CSS_VAR_PREFIX = "--teppan";

/**
 * Convert a theme to CSS custom properties
 */
export function themeToCSSProperties(theme: Theme): Record<string, string> {
  const props: Record<string, string> = {
    [`${CSS_VAR_PREFIX}-bg`]: theme.background,
    [`${CSS_VAR_PREFIX}-fg`]: theme.foreground,
  };

  if (theme.lineHighlight) {
    props[`${CSS_VAR_PREFIX}-line-highlight`] = theme.lineHighlight;
  }
  if (theme.activeLine) {
    props[`${CSS_VAR_PREFIX}-active-line`] = theme.activeLine;
  }
  if (theme.matchingBracket) {
    props[`${CSS_VAR_PREFIX}-matching-bracket`] = theme.matchingBracket;
  }

  // Selection
  if (theme.selection) {
    if (theme.selection.background) {
      props[`${CSS_VAR_PREFIX}-selection-bg`] = theme.selection.background;
    }
    if (theme.selection.foreground) {
      props[`${CSS_VAR_PREFIX}-selection-fg`] = theme.selection.foreground;
    }
    if (theme.selection.backgroundUnfocused) {
      props[`${CSS_VAR_PREFIX}-selection-bg-unfocused`] =
        theme.selection.backgroundUnfocused;
    }
  }

  // Cursor
  if (theme.cursor) {
    if (theme.cursor.color) {
      props[`${CSS_VAR_PREFIX}-cursor-color`] = theme.cursor.color;
    }
    if (theme.cursor.width) {
      props[`${CSS_VAR_PREFIX}-cursor-width`] = theme.cursor.width;
    }
  }

  // Gutter
  if (theme.gutter) {
    if (theme.gutter.background) {
      props[`${CSS_VAR_PREFIX}-gutter-bg`] = theme.gutter.background;
    }
    if (theme.gutter.foreground) {
      props[`${CSS_VAR_PREFIX}-gutter-fg`] = theme.gutter.foreground;
    }
    if (theme.gutter.border) {
      props[`${CSS_VAR_PREFIX}-gutter-border`] = theme.gutter.border;
    }
    if (theme.gutter.activeLineNumber) {
      props[`${CSS_VAR_PREFIX}-gutter-active`] = theme.gutter.activeLineNumber;
    }
  }

  // Token styles
  if (theme.tokens) {
    for (const [token, color] of Object.entries(theme.tokens)) {
      if (color) {
        props[`${CSS_VAR_PREFIX}-token-${token}`] = color;
      }
    }
  }

  // Custom properties
  if (theme.customProperties) {
    for (const [key, value] of Object.entries(theme.customProperties)) {
      props[key.startsWith("--") ? key : `--${key}`] = value;
    }
  }

  return props;
}

/**
 * Apply a theme to an element
 */
export function applyTheme(element: HTMLElement, theme: Theme): void {
  const props = themeToCSSProperties(theme);
  for (const [key, value] of Object.entries(props)) {
    element.style.setProperty(key, value);
  }

  // Set data attribute for theme type
  element.dataset.themeType = theme.type;
  element.dataset.themeName = theme.name;
}

/**
 * Generate CSS styles for a theme
 */
export function generateThemeCSS(theme: Theme): string {
  const props = themeToCSSProperties(theme);
  const cssVars = Object.entries(props)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  return `.teppan-editor[data-theme-name="${theme.name}"] {\n${cssVars}\n}`;
}

/**
 * Merge two themes, with the second theme overriding the first
 */
export function mergeThemes(base: Theme, override: Partial<Theme>): Theme {
  return {
    ...base,
    ...override,
    selection: { ...base.selection, ...override.selection },
    cursor: { ...base.cursor, ...override.cursor },
    gutter: { ...base.gutter, ...override.gutter },
    tokens: { ...base.tokens, ...override.tokens },
    customProperties: {
      ...base.customProperties,
      ...override.customProperties,
    },
  };
}
