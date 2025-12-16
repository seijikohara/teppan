// Theme types and utilities
export {
  type Theme,
  type TokenStyles,
  type GutterStyles,
  type SelectionStyles,
  type CursorStyles,
  CSS_VAR_PREFIX,
  themeToCSSProperties,
  applyTheme,
  generateThemeCSS,
  mergeThemes,
} from "./theme";

// Default themes
export { defaultLight } from "./default-light";
export { defaultDark } from "./default-dark";

// Base styles
export { baseStyles, injectBaseStyles, removeBaseStyles } from "./base";
