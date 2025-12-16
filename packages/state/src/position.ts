/**
 * Represents a position in the document (line and column)
 */
export interface Position {
  /** Line number (0-indexed) */
  line: number;
  /** Column number (0-indexed) */
  column: number;
}

/**
 * Create a new position
 */
export function createPosition(line: number, column: number): Position {
  return { line, column };
}

/**
 * Compare two positions
 * Returns negative if a < b, zero if equal, positive if a > b
 */
export function comparePositions(a: Position, b: Position): number {
  if (a.line !== b.line) {
    return a.line - b.line;
  }
  return a.column - b.column;
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.line === b.line && a.column === b.column;
}

/**
 * Represents a range in the document
 */
export interface Range {
  /** Start position (inclusive) */
  start: Position;
  /** End position (exclusive) */
  end: Position;
}

/**
 * Create a new range
 */
export function createRange(start: Position, end: Position): Range {
  // Ensure start comes before end
  if (comparePositions(start, end) > 0) {
    return { start: end, end: start };
  }
  return { start, end };
}

/**
 * Check if a range is empty (start equals end)
 */
export function isRangeEmpty(range: Range): boolean {
  return positionsEqual(range.start, range.end);
}

/**
 * Check if a range contains a position
 */
export function rangeContains(range: Range, position: Position): boolean {
  return (
    comparePositions(position, range.start) >= 0 &&
    comparePositions(position, range.end) < 0
  );
}

/**
 * Check if two ranges overlap
 */
export function rangesOverlap(a: Range, b: Range): boolean {
  return (
    comparePositions(a.start, b.end) < 0 && comparePositions(b.start, a.end) < 0
  );
}
