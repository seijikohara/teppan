/**
 * Token types for syntax highlighting
 */
export type TokenType =
  | "comment"
  | "keyword"
  | "string"
  | "number"
  | "operator"
  | "function"
  | "variable"
  | "type"
  | "class"
  | "property"
  | "punctuation"
  | "regexp"
  | "constant"
  | "boolean"
  | "null"
  | "tag"
  | "attribute"
  | "namespace"
  | "label"
  | "meta"
  | "invalid"
  | "deprecated"
  | "text";

/**
 * A token represents a highlighted range of text
 */
export interface Token {
  /** Token type */
  type: TokenType;
  /** Start offset in the document */
  from: number;
  /** End offset in the document */
  to: number;
  /** Modifiers (e.g., "definition", "declaration", "readonly") */
  modifiers?: string[];
}

/**
 * Result of tokenizing a line
 */
export interface LineTokens {
  /** Line number (0-indexed) */
  line: number;
  /** Tokens on this line */
  tokens: Token[];
}

/**
 * Token class name generator
 */
export function tokenClassName(token: Token): string {
  let className = `teppan-token-${token.type}`;
  if (token.modifiers) {
    for (const mod of token.modifiers) {
      className += ` teppan-token-${mod}`;
    }
  }
  return className;
}

/**
 * Create a token
 */
export function createToken(
  type: TokenType,
  from: number,
  to: number,
  modifiers?: string[],
): Token {
  return { type, from, to, modifiers };
}
