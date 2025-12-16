import { type Extension, type StateField, createStateField } from "./extension";
import type { EditorState } from "./state";
import type { Transaction } from "./transaction";

/**
 * Search query configuration
 */
export interface SearchQuery {
  /** The search string */
  search: string;
  /** The replacement string */
  replace?: string;
  /** Whether the search is case sensitive */
  caseSensitive?: boolean;
  /** Whether to match whole words only */
  wholeWord?: boolean;
  /** Whether to treat the search string as a regular expression */
  regexp?: boolean;
}

/**
 * A single search match result
 */
export interface SearchMatch {
  /** Start offset of the match */
  from: number;
  /** End offset of the match */
  to: number;
  /** The matched text */
  match: string;
}

/**
 * Search state for the editor
 */
export interface SearchState {
  /** The current search query */
  query: SearchQuery | null;
  /** All matches in the document */
  matches: SearchMatch[];
  /** Index of the currently selected match (-1 if none) */
  currentMatchIndex: number;
}

/**
 * Create an empty search state
 */
export function createSearchState(): SearchState {
  return {
    query: null,
    matches: [],
    currentMatchIndex: -1,
  };
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a RegExp from a search query
 */
export function buildSearchRegex(query: SearchQuery): RegExp | null {
  if (!query.search) {
    return null;
  }

  let pattern: string;

  if (query.regexp) {
    try {
      pattern = query.search;
    } catch {
      return null;
    }
  } else {
    pattern = escapeRegExp(query.search);
  }

  if (query.wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }

  const flags = query.caseSensitive ? "g" : "gi";

  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

/**
 * Find all matches in a document
 */
export function findMatches(doc: string, query: SearchQuery): SearchMatch[] {
  const regex = buildSearchRegex(query);
  if (!regex) {
    return [];
  }

  const matches: SearchMatch[] = [];

  for (;;) {
    const match = regex.exec(doc);
    if (match === null) break;

    matches.push({
      from: match.index,
      to: match.index + match[0].length,
      match: match[0],
    });

    // Prevent infinite loop for zero-length matches
    if (match[0].length === 0) {
      regex.lastIndex++;
    }
  }

  return matches;
}

/**
 * Find the match nearest to a given position
 */
export function findNearestMatch(
  matches: SearchMatch[],
  offset: number,
  direction: "forward" | "backward" = "forward",
): number {
  if (matches.length === 0) {
    return -1;
  }

  if (direction === "forward") {
    for (let i = 0; i < matches.length; i++) {
      if (matches[i]!.from >= offset) {
        return i;
      }
    }
    // Wrap around to the first match
    return 0;
  }

  for (let i = matches.length - 1; i >= 0; i--) {
    if (matches[i]!.to <= offset) {
      return i;
    }
  }
  // Wrap around to the last match
  return matches.length - 1;
}

/**
 * State field for search functionality
 */
export const searchStateField: StateField<SearchState> = createStateField({
  create: () => createSearchState(),
  update: (value, transaction) => {
    // Check for search effects in the transaction
    const setQueryEffect = transaction.effects.find(
      (e) => e.type.id === setSearchQueryEffect.id,
    );
    const setMatchIndexEffect = transaction.effects.find(
      (e) => e.type.id === setCurrentMatchIndexEffect.id,
    );
    const clearSearchEffect = transaction.effects.find(
      (e) => e.type.id === clearSearchStateEffect.id,
    );

    if (clearSearchEffect) {
      return createSearchState();
    }

    let newValue = value;

    if (setQueryEffect) {
      const query = setQueryEffect.value as SearchQuery;
      newValue = {
        ...newValue,
        query,
        matches: [],
        currentMatchIndex: -1,
      };
    }

    if (setMatchIndexEffect) {
      newValue = {
        ...newValue,
        currentMatchIndex: setMatchIndexEffect.value as number,
      };
    }

    // If document changed, we need to recalculate matches
    // The actual match calculation will happen when accessed
    if (transaction.docChanged && newValue.query) {
      newValue = {
        ...newValue,
        matches: [], // Clear matches, will be recalculated
        currentMatchIndex: -1,
      };
    }

    return newValue;
  },
});

/**
 * State effect types for search
 */
export const setSearchQueryEffect = {
  id: Symbol("setSearchQuery"),
  of: (value: SearchQuery) => ({
    type: { id: Symbol("setSearchQuery"), of: null! },
    value,
  }),
};

export const setCurrentMatchIndexEffect = {
  id: Symbol("setCurrentMatchIndex"),
  of: (value: number) => ({
    type: { id: Symbol("setCurrentMatchIndex"), of: null! },
    value,
  }),
};

export const clearSearchStateEffect = {
  id: Symbol("clearSearchState"),
  of: () => ({
    type: { id: Symbol("clearSearchState"), of: null! },
    value: undefined,
  }),
};

/**
 * Get the current search state from an EditorState
 */
export function getSearchState(state: EditorState): SearchState {
  try {
    return state.field(searchStateField);
  } catch {
    return createSearchState();
  }
}

/**
 * Create a transaction to set the search query
 */
export function setSearchQuery(
  state: EditorState,
  query: SearchQuery,
): Transaction {
  return state.transaction({
    effects: [setSearchQueryEffect.of(query)],
  });
}

/**
 * Create a transaction to select a specific match
 */
export function selectMatch(
  state: EditorState,
  matchIndex: number,
): Transaction {
  return state.transaction({
    effects: [setCurrentMatchIndexEffect.of(matchIndex)],
  });
}

/**
 * Create a transaction to clear the search state
 */
export function clearSearch(state: EditorState): Transaction {
  return state.transaction({
    effects: [clearSearchStateEffect.of()],
  });
}

/**
 * Find and return all matches for the current query
 */
export function searchInDocument(
  state: EditorState,
  query: SearchQuery,
): SearchMatch[] {
  return findMatches(state.doc, query);
}

/**
 * Create a transaction to replace the current match
 */
export function replaceMatch(
  state: EditorState,
  match: SearchMatch,
  replacement: string,
): Transaction {
  return state.transaction({
    changes: [
      {
        from: match.from,
        to: match.to,
        insert: replacement,
      },
    ],
  });
}

/**
 * Create a transaction to replace all matches
 */
export function replaceAllMatches(
  state: EditorState,
  matches: SearchMatch[],
  replacement: string,
): Transaction {
  // Apply replacements from end to start to preserve offsets
  const sortedMatches = [...matches].sort((a, b) => b.from - a.from);
  const changes = sortedMatches.map((match) => ({
    from: match.from,
    to: match.to,
    insert: replacement,
  }));

  return state.transaction({
    changes,
  });
}

/**
 * Create the search extension
 */
export function search(): Extension {
  return {
    name: "search",
    stateFields: [searchStateField as StateField<unknown>],
    decorationProviders: [
      (state) => {
        const searchState = getSearchState(state);
        if (!searchState.query || searchState.matches.length === 0) {
          return [];
        }

        return searchState.matches.map((match, index) => ({
          type: "range" as const,
          from: match.from,
          to: match.to,
          class:
            index === searchState.currentMatchIndex
              ? "teppan-search-match-current"
              : "teppan-search-match",
        }));
      },
    ],
  };
}
