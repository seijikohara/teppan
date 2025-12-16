import type { Language } from "../language";

/**
 * JSON language definition
 */
export const json: Language = {
  name: "json",
  extensions: ["json", "jsonc", "json5"],
  mimeTypes: ["application/json"],
  brackets: [
    ["{", "}"],
    ["[", "]"],
  ],
  patterns: [
    // Comments (JSONC and JSON5)
    { pattern: /\/\/[^\n]*/, type: "comment" },
    { pattern: /\/\*[\s\S]*?\*\//, type: "comment" },

    // Strings (property keys and values)
    { pattern: /"(?:[^"\\]|\\.)*"\s*(?=:)/, type: "property" }, // Property keys
    { pattern: /"(?:[^"\\]|\\.)*"/, type: "string" }, // String values
    { pattern: /'(?:[^'\\]|\\.)*'/, type: "string" }, // Single-quoted strings (JSON5)

    // Numbers
    { pattern: /[+-]?(?:0x[0-9a-fA-F]+|0o[0-7]+|0b[01]+)/, type: "number" }, // Hex/Octal/Binary (JSON5)
    { pattern: /[+-]?(?:Infinity|NaN)/, type: "number" }, // Special values (JSON5)
    { pattern: /[+-]?\d+\.?\d*(?:[eE][+-]?\d+)?/, type: "number" }, // Standard numbers

    // Boolean
    { pattern: /\b(true|false)\b/, type: "boolean" },

    // Null
    { pattern: /\bnull\b/, type: "null" },

    // Punctuation
    { pattern: /[{}[\]:,]/, type: "punctuation" },

    // Trailing commas indicator (JSON5)
    { pattern: /,(?=\s*[}\]])/, type: "punctuation" },
  ],
};

/**
 * JSONC (JSON with Comments) language definition
 * Same as JSON but explicitly allows comments
 */
export const jsonc: Language = {
  ...json,
  name: "jsonc",
  extensions: ["jsonc"],
  lineComment: "//",
  blockComment: ["/*", "*/"],
};

/**
 * JSON5 language definition
 * Extended JSON with more lenient syntax
 */
export const json5: Language = {
  ...json,
  name: "json5",
  extensions: ["json5"],
  lineComment: "//",
  blockComment: ["/*", "*/"],
  patterns: [
    // Comments
    { pattern: /\/\/[^\n]*/, type: "comment" },
    { pattern: /\/\*[\s\S]*?\*\//, type: "comment" },

    // Strings
    { pattern: /"(?:[^"\\]|\\.)*"\s*(?=:)/, type: "property" },
    { pattern: /'(?:[^'\\]|\\.)*'\s*(?=:)/, type: "property" }, // Single-quoted keys
    { pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*\s*(?=:)/, type: "property" }, // Unquoted keys
    { pattern: /"(?:[^"\\]|\\.)*"/, type: "string" },
    { pattern: /'(?:[^'\\]|\\.)*'/, type: "string" },

    // Numbers
    { pattern: /[+-]?0x[0-9a-fA-F]+/, type: "number" },
    { pattern: /[+-]?(?:Infinity|NaN)/, type: "number" },
    { pattern: /[+-]?\d+\.?\d*(?:[eE][+-]?\d+)?/, type: "number" },
    { pattern: /[+-]?\.\d+(?:[eE][+-]?\d+)?/, type: "number" }, // Leading decimal point

    // Boolean
    { pattern: /\b(true|false)\b/, type: "boolean" },

    // Null
    { pattern: /\bnull\b/, type: "null" },

    // Undefined (JSON5)
    { pattern: /\bundefined\b/, type: "null" },

    // Punctuation
    { pattern: /[{}[\]:,]/, type: "punctuation" },
  ],
};
