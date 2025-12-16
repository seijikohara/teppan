export { EditorState, type EditorStateConfig } from "./state";
export {
  Transaction,
  type TransactionSpec,
  type ChangeSpec,
} from "./transaction";
export {
  type Extension,
  type StateField,
  type StateEffect,
  type StateEffectType,
  type TransactionFilter,
  type UpdateListener,
  type KeyBinding,
  type DecorationProvider,
  type Decoration,
  combineExtensions,
  createStateField,
  createStateEffectType,
} from "./extension";
export { SelectionSet, SelectionRange } from "./selection";
export { ChangeSet, Change } from "./changeset";
export {
  type Position,
  type Range,
  createPosition,
  createRange,
  comparePositions,
  positionsEqual,
  isRangeEmpty,
  rangeContains,
  rangesOverlap,
} from "./position";
export {
  type SearchQuery,
  type SearchMatch,
  type SearchState,
  search,
  searchStateField,
  getSearchState,
  setSearchQuery,
  selectMatch,
  clearSearch,
  searchInDocument,
  replaceMatch,
  replaceAllMatches,
  findMatches,
  findNearestMatch,
  buildSearchRegex,
} from "./search";
export {
  type BracketPair,
  type BracketMatch,
  type BracketState,
  DEFAULT_BRACKET_PAIRS,
  bracketMatching,
  bracketStateField,
  getBracketState,
  findMatchingBracket,
  findBracketAtCursor,
  jumpToMatchingBracket,
  isOpeningBracket,
  isClosingBracket,
  isInsideStringOrComment,
} from "./bracket";
