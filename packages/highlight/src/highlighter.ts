import type {
  Decoration,
  DecorationProvider,
  EditorState,
} from "@teppan/state";
import type { Theme } from "@teppan/theme";
import type { Language } from "./language";
import { tokenizeLine } from "./language";
import type { LineTokens, Token } from "./tokens";
import { tokenClassName } from "./tokens";

/**
 * Configuration for the highlighter
 */
export interface HighlighterConfig {
  /** Language to use for highlighting */
  language?: Language;
  /** Theme for colors (optional, uses CSS classes by default) */
  theme?: Theme;
}

/**
 * Highlighter manages syntax highlighting for the editor
 */
export class Highlighter {
  private language: Language | undefined;
  private theme: Theme | undefined;
  private tokenCache: Map<number, Token[]> = new Map();
  private documentVersion = 0;

  constructor(config: HighlighterConfig = {}) {
    this.language = config.language;
    this.theme = config.theme;
  }

  /**
   * Set the language
   */
  setLanguage(language: Language | undefined): void {
    this.language = language;
    this.invalidateCache();
  }

  /**
   * Set the theme
   */
  setTheme(theme: Theme | undefined): void {
    this.theme = theme;
  }

  /**
   * Get the current language
   */
  getLanguage(): Language | undefined {
    return this.language;
  }

  /**
   * Get the current theme
   */
  getTheme(): Theme | undefined {
    return this.theme;
  }

  /**
   * Invalidate the token cache
   */
  invalidateCache(): void {
    this.tokenCache.clear();
    this.documentVersion++;
  }

  /**
   * Invalidate cache for specific lines
   */
  invalidateLines(from: number, to: number): void {
    for (let i = from; i <= to; i++) {
      this.tokenCache.delete(i);
    }
    this.documentVersion++;
  }

  /**
   * Get tokens for a line
   */
  getLineTokens(state: EditorState, lineNumber: number): Token[] {
    if (!this.language) {
      return [];
    }

    // Check cache
    const cached = this.tokenCache.get(lineNumber);
    if (cached) {
      return cached;
    }

    // Get line info
    const lineInfo = state.line(lineNumber);
    if (!lineInfo) {
      return [];
    }

    // Tokenize the line
    const tokens = tokenizeLine(lineInfo.text, lineInfo.from, this.language);

    // Cache the result
    this.tokenCache.set(lineNumber, tokens);

    return tokens;
  }

  /**
   * Get all tokens for visible lines
   */
  getTokens(
    state: EditorState,
    fromLine: number,
    toLine: number,
  ): LineTokens[] {
    const result: LineTokens[] = [];

    for (let line = fromLine; line < toLine; line++) {
      result.push({
        line,
        tokens: this.getLineTokens(state, line),
      });
    }

    return result;
  }

  /**
   * Convert tokens to decorations
   */
  tokensToDecorations(tokens: Token[]): Decoration[] {
    return tokens.map((token) => ({
      type: "range" as const,
      from: token.from,
      to: token.to,
      class: tokenClassName(token),
    }));
  }

  /**
   * Create a decoration provider for the editor
   */
  createDecorationProvider(): DecorationProvider {
    return (state: EditorState): Decoration[] => {
      if (!this.language) {
        return [];
      }

      const decorations: Decoration[] = [];

      // Get all tokens for the document
      for (let line = 0; line < state.lineCount; line++) {
        const tokens = this.getLineTokens(state, line);
        decorations.push(...this.tokensToDecorations(tokens));
      }

      return decorations;
    };
  }
}

/**
 * Create a highlighter extension for the editor state
 */
export function createHighlighterExtension(config: HighlighterConfig = {}) {
  const highlighter = new Highlighter(config);

  return {
    name: "highlighter",
    decorationProviders: [highlighter.createDecorationProvider()],
    highlighter, // Expose highlighter for external access
  };
}
