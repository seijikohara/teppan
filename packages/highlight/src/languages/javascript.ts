import type { Language } from "../language";

/**
 * JavaScript keywords
 */
const jsKeywords = [
  "break",
  "case",
  "catch",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "finally",
  "for",
  "function",
  "if",
  "in",
  "instanceof",
  "new",
  "return",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  // ES6+
  "class",
  "const",
  "export",
  "extends",
  "import",
  "let",
  "static",
  "yield",
  "async",
  "await",
  "from",
  "as",
  "of",
];

/**
 * TypeScript-specific keywords
 */
const tsKeywords = [
  "abstract",
  "declare",
  "enum",
  "implements",
  "interface",
  "module",
  "namespace",
  "private",
  "protected",
  "public",
  "readonly",
  "type",
  "keyof",
  "infer",
  "asserts",
  "is",
  "override",
  "satisfies",
];

/**
 * Built-in constants
 */
const constants = ["true", "false", "null", "undefined", "NaN", "Infinity"];

/**
 * Create a keyword pattern
 */
function keywordPattern(keywords: string[]): RegExp {
  return new RegExp(`\\b(${keywords.join("|")})\\b`);
}

/**
 * JavaScript language definition
 */
export const javascript: Language = {
  name: "javascript",
  extensions: ["js", "mjs", "cjs", "jsx"],
  mimeTypes: ["text/javascript", "application/javascript"],
  lineComment: "//",
  blockComment: ["/*", "*/"],
  brackets: [
    ["(", ")"],
    ["{", "}"],
    ["[", "]"],
  ],
  patterns: [
    // Comments
    { pattern: /\/\/[^\n]*/, type: "comment" },
    { pattern: /\/\*[\s\S]*?\*\//, type: "comment" },

    // Strings
    { pattern: /"(?:[^"\\]|\\.)*"/, type: "string" },
    { pattern: /'(?:[^'\\]|\\.)*'/, type: "string" },
    { pattern: /`(?:[^`\\]|\\.|\$\{[^}]*\})*`/, type: "string" }, // Template literals

    // Regular expressions
    { pattern: /\/(?![/*])(?:[^/\\]|\\.)+\/[gimsuvy]*/, type: "regexp" },

    // Numbers
    { pattern: /0[xX][0-9a-fA-F]+(?:_[0-9a-fA-F]+)*n?/, type: "number" }, // Hex
    { pattern: /0[oO][0-7]+(?:_[0-7]+)*n?/, type: "number" }, // Octal
    { pattern: /0[bB][01]+(?:_[01]+)*n?/, type: "number" }, // Binary
    { pattern: /\d+(?:_\d+)*\.?\d*(?:[eE][+-]?\d+)?n?/, type: "number" }, // Decimal

    // Keywords
    { pattern: keywordPattern(jsKeywords), type: "keyword" },

    // Constants
    { pattern: keywordPattern(constants), type: "constant" },
    { pattern: /\b(true|false)\b/, type: "boolean" },
    { pattern: /\b(null|undefined)\b/, type: "null" },

    // Function calls
    { pattern: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/, type: "function" },

    // Property access
    { pattern: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/, type: "property" },

    // Class names (capitalized identifiers after class/new/extends)
    { pattern: /\b(class|new|extends)\s+([A-Z][a-zA-Z0-9_$]*)/, type: "class" },

    // Operators
    {
      pattern: /[+\-*/%=<>!&|^~?:]+|&&|\|\||\?\?|\.{3}/,
      type: "operator",
    },

    // Punctuation
    { pattern: /[{}[\]();,.]/, type: "punctuation" },

    // Identifiers (variables)
    { pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*/, type: "variable" },
  ],
};

/**
 * TypeScript language definition
 */
export const typescript: Language = {
  name: "typescript",
  extensions: ["ts", "mts", "cts", "tsx"],
  mimeTypes: ["text/typescript", "application/typescript"],
  lineComment: "//",
  blockComment: ["/*", "*/"],
  brackets: [
    ["(", ")"],
    ["{", "}"],
    ["[", "]"],
    ["<", ">"],
  ],
  patterns: [
    // Comments
    { pattern: /\/\/[^\n]*/, type: "comment" },
    { pattern: /\/\*[\s\S]*?\*\//, type: "comment" },

    // Strings
    { pattern: /"(?:[^"\\]|\\.)*"/, type: "string" },
    { pattern: /'(?:[^'\\]|\\.)*'/, type: "string" },
    { pattern: /`(?:[^`\\]|\\.|\$\{[^}]*\})*`/, type: "string" },

    // Regular expressions
    { pattern: /\/(?![/*])(?:[^/\\]|\\.)+\/[gimsuvy]*/, type: "regexp" },

    // Numbers
    { pattern: /0[xX][0-9a-fA-F]+(?:_[0-9a-fA-F]+)*n?/, type: "number" },
    { pattern: /0[oO][0-7]+(?:_[0-7]+)*n?/, type: "number" },
    { pattern: /0[bB][01]+(?:_[01]+)*n?/, type: "number" },
    { pattern: /\d+(?:_\d+)*\.?\d*(?:[eE][+-]?\d+)?n?/, type: "number" },

    // TypeScript keywords
    {
      pattern: keywordPattern([...jsKeywords, ...tsKeywords]),
      type: "keyword",
    },

    // Constants
    { pattern: keywordPattern(constants), type: "constant" },
    { pattern: /\b(true|false)\b/, type: "boolean" },
    { pattern: /\b(null|undefined)\b/, type: "null" },

    // Type annotations (after colon)
    { pattern: /:\s*([A-Z][a-zA-Z0-9_$<>[\],\s|&]*)/, type: "type" },

    // Generic type parameters
    { pattern: /<[A-Z][a-zA-Z0-9_$,\s]*>/, type: "type" },

    // Function calls
    { pattern: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/, type: "function" },

    // Property access
    { pattern: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/, type: "property" },

    // Class names
    {
      pattern: /\b(class|new|extends|implements)\s+([A-Z][a-zA-Z0-9_$]*)/,
      type: "class",
    },

    // Interface/type names
    { pattern: /\b(interface|type)\s+([A-Z][a-zA-Z0-9_$]*)/, type: "type" },

    // Operators
    {
      pattern: /[+\-*/%=<>!&|^~?:]+|&&|\|\||\?\?|\.{3}/,
      type: "operator",
    },

    // Punctuation
    { pattern: /[{}[\]();,.<>]/, type: "punctuation" },

    // Identifiers
    { pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*/, type: "variable" },
  ],
};

/**
 * JSX language definition (extends JavaScript)
 */
export const jsx: Language = {
  ...javascript,
  name: "jsx",
  extensions: ["jsx"],
  mimeTypes: ["text/jsx"],
  patterns: [
    // JSX self-closing tags
    { pattern: /<([A-Z][a-zA-Z0-9]*)[^>]*\/>/, type: "tag" },
    // JSX opening tags
    { pattern: /<([A-Z][a-zA-Z0-9]*)\b/, type: "tag" },
    // JSX closing tags
    { pattern: /<\/([A-Z][a-zA-Z0-9]*)>/, type: "tag" },
    // HTML tags
    { pattern: /<\/?([a-z][a-zA-Z0-9-]*)/, type: "tag" },
    // JSX attributes
    { pattern: /\b([a-zA-Z][a-zA-Z0-9-]*)(?==)/, type: "attribute" },
    ...javascript.patterns,
  ],
};

/**
 * TSX language definition (extends TypeScript)
 */
export const tsx: Language = {
  ...typescript,
  name: "tsx",
  extensions: ["tsx"],
  mimeTypes: ["text/tsx"],
  patterns: [
    // JSX self-closing tags
    { pattern: /<([A-Z][a-zA-Z0-9]*)[^>]*\/>/, type: "tag" },
    // JSX opening tags
    { pattern: /<([A-Z][a-zA-Z0-9]*)\b/, type: "tag" },
    // JSX closing tags
    { pattern: /<\/([A-Z][a-zA-Z0-9]*)>/, type: "tag" },
    // HTML tags
    { pattern: /<\/?([a-z][a-zA-Z0-9-]*)/, type: "tag" },
    // JSX attributes
    { pattern: /\b([a-zA-Z][a-zA-Z0-9-]*)(?==)/, type: "attribute" },
    ...typescript.patterns,
  ],
};
