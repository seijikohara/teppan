import type { Token, TokenType } from "./tokens";

/**
 * A pattern for matching tokens
 */
export interface TokenPattern {
  /** Regular expression pattern */
  pattern: RegExp;
  /** Token type to assign */
  type: TokenType;
  /** Optional modifiers */
  modifiers?: string[];
}

/**
 * Language definition for syntax highlighting
 */
export interface Language {
  /** Language name */
  name: string;
  /** File extensions */
  extensions: string[];
  /** MIME types */
  mimeTypes?: string[];
  /** Token patterns (applied in order) */
  patterns: TokenPattern[];
  /** Strings that open/close block comments */
  blockComment?: [string, string];
  /** String that starts a line comment */
  lineComment?: string;
  /** Bracket pairs for matching */
  brackets?: [string, string][];
}

/**
 * Registry of available languages
 */
export class LanguageRegistry {
  private languages: Map<string, Language> = new Map();
  private extensionMap: Map<string, string> = new Map();
  private mimeTypeMap: Map<string, string> = new Map();

  /**
   * Register a language
   */
  register(language: Language): void {
    this.languages.set(language.name, language);

    for (const ext of language.extensions) {
      this.extensionMap.set(ext.toLowerCase(), language.name);
    }

    if (language.mimeTypes) {
      for (const mime of language.mimeTypes) {
        this.mimeTypeMap.set(mime, language.name);
      }
    }
  }

  /**
   * Get a language by name
   */
  get(name: string): Language | undefined {
    return this.languages.get(name);
  }

  /**
   * Get a language by file extension
   */
  getByExtension(extension: string): Language | undefined {
    const ext = extension.startsWith(".") ? extension.slice(1) : extension;
    const name = this.extensionMap.get(ext.toLowerCase());
    return name ? this.languages.get(name) : undefined;
  }

  /**
   * Get a language by MIME type
   */
  getByMimeType(mimeType: string): Language | undefined {
    const name = this.mimeTypeMap.get(mimeType);
    return name ? this.languages.get(name) : undefined;
  }

  /**
   * Get all registered languages
   */
  getAll(): Language[] {
    return Array.from(this.languages.values());
  }

  /**
   * Check if a language is registered
   */
  has(name: string): boolean {
    return this.languages.has(name);
  }
}

/**
 * Global language registry
 */
export const globalLanguageRegistry = new LanguageRegistry();

/**
 * Register a language in the global registry
 */
export function registerLanguage(language: Language): void {
  globalLanguageRegistry.register(language);
}

/**
 * Get a language from the global registry
 */
export function getLanguage(name: string): Language | undefined {
  return globalLanguageRegistry.get(name);
}

/**
 * Simple tokenizer using regex patterns
 */
export function tokenize(text: string, language: Language): Token[] {
  const tokens: Token[] = [];
  let remaining = text;
  let offset = 0;

  while (remaining.length > 0) {
    let matched = false;

    for (const { pattern, type, modifiers } of language.patterns) {
      // Reset lastIndex for each attempt
      pattern.lastIndex = 0;
      const match = pattern.exec(remaining);

      if (match && match.index === 0) {
        const matchText = match[0];
        tokens.push({
          type,
          from: offset,
          to: offset + matchText.length,
          modifiers,
        });

        offset += matchText.length;
        remaining = remaining.slice(matchText.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Skip unmatched character
      offset += 1;
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

/**
 * Tokenize a single line
 */
export function tokenizeLine(
  line: string,
  lineOffset: number,
  language: Language,
): Token[] {
  const tokens = tokenize(line, language);

  // Adjust offsets to be document-relative
  return tokens.map((token) => ({
    ...token,
    from: token.from + lineOffset,
    to: token.to + lineOffset,
  }));
}
