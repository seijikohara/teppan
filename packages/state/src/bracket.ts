import { type Extension, type StateField, createStateField } from "./extension";
import { SelectionSet } from "./selection";
import type { EditorState } from "./state";
import type { Transaction } from "./transaction";

/**
 * Represents a bracket pair
 */
export interface BracketPair {
  /** Opening bracket character */
  open: string;
  /** Closing bracket character */
  close: string;
}

/**
 * Default bracket pairs
 */
export const DEFAULT_BRACKET_PAIRS: readonly BracketPair[] = [
  { open: "(", close: ")" },
  { open: "[", close: "]" },
  { open: "{", close: "}" },
  { open: "<", close: ">" },
];

/**
 * Represents a matched bracket pair
 */
export interface BracketMatch {
  /** Position of the bracket at cursor */
  from: number;
  /** Position of the matching bracket */
  to: number;
  /** Whether the match is valid (true) or unmatched (false) */
  matched: boolean;
}

/**
 * State for bracket matching
 */
export interface BracketState {
  /** Current bracket match, if any */
  match: BracketMatch | null;
  /** Configuration for bracket pairs */
  pairs: readonly BracketPair[];
}

/**
 * Create initial bracket state
 */
export function createBracketState(
  pairs: readonly BracketPair[] = DEFAULT_BRACKET_PAIRS,
): BracketState {
  return {
    match: null,
    pairs,
  };
}

/**
 * Check if a character is an opening bracket
 */
export function isOpeningBracket(
  char: string,
  pairs: readonly BracketPair[],
): BracketPair | null {
  return pairs.find((p) => p.open === char) ?? null;
}

/**
 * Check if a character is a closing bracket
 */
export function isClosingBracket(
  char: string,
  pairs: readonly BracketPair[],
): BracketPair | null {
  return pairs.find((p) => p.close === char) ?? null;
}

/**
 * Check if a position is inside a string or comment
 * This is a simple heuristic - counts quotes before position
 */
export function isInsideStringOrComment(doc: string, pos: number): boolean {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < pos && i < doc.length; i++) {
    const char = doc[i];
    const nextChar = doc[i + 1];
    const prevChar = i > 0 ? doc[i - 1] : "";

    // Check for newline (ends line comments)
    if (char === "\n") {
      inLineComment = false;
      continue;
    }

    // Skip if in line comment
    if (inLineComment) continue;

    // Check for block comment end
    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        i++; // Skip the /
      }
      continue;
    }

    // Check for comment start (only if not in string)
    if (!inSingleQuote && !inDoubleQuote && !inTemplateString) {
      if (char === "/" && nextChar === "/") {
        inLineComment = true;
        i++; // Skip the second /
        continue;
      }
      if (char === "/" && nextChar === "*") {
        inBlockComment = true;
        i++; // Skip the *
        continue;
      }
    }

    // Handle escape sequences
    if (prevChar === "\\") continue;

    // Toggle string states
    if (char === "'" && !inDoubleQuote && !inTemplateString) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && !inTemplateString) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === "`" && !inSingleQuote && !inDoubleQuote) {
      inTemplateString = !inTemplateString;
    }
  }

  return inSingleQuote || inDoubleQuote || inTemplateString || inBlockComment;
}

/**
 * Find the matching bracket for an opening bracket
 * Scans forward to find the closing bracket
 */
export function findMatchingCloseBracket(
  doc: string,
  pos: number,
  pair: BracketPair,
  _pairs?: readonly BracketPair[],
): number | null {
  let depth = 1;

  for (let i = pos + 1; i < doc.length; i++) {
    // Skip positions inside strings or comments
    if (isInsideStringOrComment(doc, i)) continue;

    const char = doc[i];

    if (char === pair.open) {
      depth++;
    } else if (char === pair.close) {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return null;
}

/**
 * Find the matching bracket for a closing bracket
 * Scans backward to find the opening bracket
 */
export function findMatchingOpenBracket(
  doc: string,
  pos: number,
  pair: BracketPair,
  _pairs?: readonly BracketPair[],
): number | null {
  let depth = 1;

  for (let i = pos - 1; i >= 0; i--) {
    // Skip positions inside strings or comments
    if (isInsideStringOrComment(doc, i)) continue;

    const char = doc[i];

    if (char === pair.close) {
      depth++;
    } else if (char === pair.open) {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return null;
}

/**
 * Find the matching bracket at a given position
 * Returns the position of the matching bracket, or null if no match
 */
export function findMatchingBracket(
  doc: string,
  pos: number,
  pairs: readonly BracketPair[] = DEFAULT_BRACKET_PAIRS,
): BracketMatch | null {
  // Check if position is inside a string or comment
  if (isInsideStringOrComment(doc, pos)) {
    return null;
  }

  const char = doc[pos];
  if (!char) return null;

  // Check if character at position is an opening bracket
  const openPair = isOpeningBracket(char, pairs);
  if (openPair) {
    const matchPos = findMatchingCloseBracket(doc, pos, openPair, pairs);
    return {
      from: pos,
      to: matchPos ?? -1,
      matched: matchPos !== null,
    };
  }

  // Check if character at position is a closing bracket
  const closePair = isClosingBracket(char, pairs);
  if (closePair) {
    const matchPos = findMatchingOpenBracket(doc, pos, closePair, pairs);
    return {
      from: pos,
      to: matchPos ?? -1,
      matched: matchPos !== null,
    };
  }

  return null;
}

/**
 * Find bracket match near cursor position
 * Checks both the character before and at cursor position
 */
export function findBracketAtCursor(
  doc: string,
  cursorPos: number,
  pairs: readonly BracketPair[] = DEFAULT_BRACKET_PAIRS,
): BracketMatch | null {
  // Check character at cursor position
  const matchAtCursor = findMatchingBracket(doc, cursorPos, pairs);
  if (matchAtCursor) return matchAtCursor;

  // Check character before cursor position
  if (cursorPos > 0) {
    const matchBeforeCursor = findMatchingBracket(doc, cursorPos - 1, pairs);
    if (matchBeforeCursor) return matchBeforeCursor;
  }

  return null;
}

/**
 * Update bracket state based on cursor position
 */
export function updateBracketState(
  state: EditorState,
  bracketState: BracketState,
): BracketState {
  const selection = state.selection.main;
  const doc = state.doc;

  // Only highlight brackets when cursor is collapsed (not selecting)
  if (!selection.isEmpty) {
    return { ...bracketState, match: null };
  }

  const cursorOffset = state.positionToOffset(selection.head);
  const match = findBracketAtCursor(doc, cursorOffset, bracketState.pairs);

  return { ...bracketState, match };
}

/**
 * State field for bracket matching
 * Note: This field is updated through the bracketMatching extension's
 * updateListeners mechanism, not through direct transaction updates.
 */
export const bracketStateField: StateField<BracketState> = createStateField({
  create: () => createBracketState(),
  update: (value, _transaction) => {
    // Return value unchanged - actual updates happen via updateListeners
    // which have access to the new state
    return value;
  },
});

/**
 * Get the bracket state from editor state
 */
export function getBracketState(state: EditorState): BracketState {
  try {
    return state.field(bracketStateField);
  } catch {
    return createBracketState();
  }
}

/**
 * Create the bracket matching extension
 */
export function bracketMatching(config?: {
  pairs?: readonly BracketPair[];
}): Extension {
  const pairs = config?.pairs ?? DEFAULT_BRACKET_PAIRS;

  return {
    name: "bracketMatching",
    stateFields: [bracketStateField as StateField<unknown>],
    decorationProviders: [
      (state) => {
        // Compute bracket match dynamically based on current cursor position
        const selection = state.selection.main;

        // Only highlight brackets when cursor is collapsed (not selecting)
        if (!selection.isEmpty) {
          return [];
        }

        const cursorOffset = state.positionToOffset(selection.head);
        const match = findBracketAtCursor(state.doc, cursorOffset, pairs);

        if (!match) {
          return [];
        }

        const { from, to, matched } = match;
        const decorations: import("./extension").Decoration[] = [];

        // Decoration for the bracket at cursor
        decorations.push({
          type: "range",
          from,
          to: from + 1,
          class: matched ? "teppan-bracket-match" : "teppan-bracket-unmatched",
        });

        // Decoration for the matching bracket (if found)
        if (matched && to >= 0) {
          decorations.push({
            type: "range",
            from: to,
            to: to + 1,
            class: "teppan-bracket-match",
          });
        }

        return decorations;
      },
    ],
  };
}

/**
 * Command to jump to the matching bracket
 */
export function jumpToMatchingBracket(
  state: EditorState,
  pairs: readonly BracketPair[] = DEFAULT_BRACKET_PAIRS,
): Transaction | null {
  const selection = state.selection.main;

  // Only works when cursor is collapsed (not selecting)
  if (!selection.isEmpty) {
    return null;
  }

  const cursorOffset = state.positionToOffset(selection.head);
  const match = findBracketAtCursor(state.doc, cursorOffset, pairs);

  if (!match || !match.matched || match.to < 0) {
    return null;
  }

  const targetPos = state.offsetToPosition(match.to);

  return state.transaction({
    selection: SelectionSet.cursor(targetPos),
    scrollIntoView: true,
  });
}
