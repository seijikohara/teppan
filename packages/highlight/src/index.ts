// Token types and utilities
export {
  type TokenType,
  type Token,
  type LineTokens,
  tokenClassName,
  createToken,
} from "./tokens";

// Language definition and registry
export {
  type TokenPattern,
  type Language,
  LanguageRegistry,
  globalLanguageRegistry,
  registerLanguage,
  getLanguage,
  tokenize,
  tokenizeLine,
} from "./language";

// Highlighter
export {
  type HighlighterConfig,
  Highlighter,
  createHighlighterExtension,
} from "./highlighter";

// Built-in languages
export {
  javascript,
  typescript,
  jsx,
  tsx,
  json,
  jsonc,
  json5,
} from "./languages";
