import {
  type Position,
  type Range,
  comparePositions,
  createRange,
} from "./position";

/**
 * Represents a single selection range with an anchor and head
 * The anchor is where the selection started, the head is where it ends
 */
export class SelectionRange {
  /** The anchor point of the selection (where it started) */
  readonly anchor: Position;
  /** The head of the selection (current cursor position) */
  readonly head: Position;

  constructor(anchor: Position, head: Position) {
    this.anchor = anchor;
    this.head = head;
  }

  /**
   * Create a cursor (collapsed selection) at a position
   */
  static cursor(position: Position): SelectionRange {
    return new SelectionRange(position, position);
  }

  /**
   * Create a selection from anchor to head
   */
  static range(anchor: Position, head: Position): SelectionRange {
    return new SelectionRange(anchor, head);
  }

  /**
   * Get the range from start to end (normalized)
   */
  get range(): Range {
    return createRange(this.anchor, this.head);
  }

  /**
   * Get the start position (min of anchor and head)
   */
  get from(): Position {
    return comparePositions(this.anchor, this.head) <= 0
      ? this.anchor
      : this.head;
  }

  /**
   * Get the end position (max of anchor and head)
   */
  get to(): Position {
    return comparePositions(this.anchor, this.head) <= 0
      ? this.head
      : this.anchor;
  }

  /**
   * Check if the selection is collapsed (cursor)
   */
  get isEmpty(): boolean {
    return (
      this.anchor.line === this.head.line &&
      this.anchor.column === this.head.column
    );
  }

  /**
   * Create a copy of this selection with a new head position
   */
  extend(head: Position): SelectionRange {
    return new SelectionRange(this.anchor, head);
  }

  /**
   * Map this selection through a change set
   */
  map(mapping: (pos: Position) => Position): SelectionRange {
    return new SelectionRange(mapping(this.anchor), mapping(this.head));
  }

  /**
   * Check if this selection equals another
   */
  equals(other: SelectionRange): boolean {
    return (
      this.anchor.line === other.anchor.line &&
      this.anchor.column === other.anchor.column &&
      this.head.line === other.head.line &&
      this.head.column === other.head.column
    );
  }
}

/**
 * Represents a set of selections (for multi-cursor support)
 */
export class SelectionSet {
  /** Array of selection ranges */
  readonly ranges: readonly SelectionRange[];
  /** Index of the main/primary selection */
  readonly mainIndex: number;

  constructor(ranges: readonly SelectionRange[], mainIndex = 0) {
    if (ranges.length === 0) {
      throw new Error("SelectionSet must have at least one range");
    }
    this.ranges = ranges;
    this.mainIndex = Math.min(mainIndex, ranges.length - 1);
  }

  /**
   * Create a selection set with a single cursor
   */
  static cursor(position: Position): SelectionSet {
    return new SelectionSet([SelectionRange.cursor(position)]);
  }

  /**
   * Create a selection set with a single range
   */
  static single(anchor: Position, head: Position): SelectionSet {
    return new SelectionSet([SelectionRange.range(anchor, head)]);
  }

  /**
   * Get the main/primary selection
   */
  get main(): SelectionRange {
    return this.ranges[this.mainIndex]!;
  }

  /**
   * Check if all selections are collapsed (cursors)
   */
  get isEmpty(): boolean {
    return this.ranges.every((r) => r.isEmpty);
  }

  /**
   * Map all selections through a change set
   */
  map(mapping: (pos: Position) => Position): SelectionSet {
    return new SelectionSet(
      this.ranges.map((r) => r.map(mapping)),
      this.mainIndex,
    );
  }

  /**
   * Replace the main selection
   */
  replaceMain(range: SelectionRange): SelectionSet {
    const newRanges = [...this.ranges];
    newRanges[this.mainIndex] = range;
    return new SelectionSet(newRanges, this.mainIndex);
  }

  /**
   * Add a new selection range
   */
  addRange(range: SelectionRange, main = true): SelectionSet {
    const newRanges = [...this.ranges, range];
    return new SelectionSet(
      newRanges,
      main ? newRanges.length - 1 : this.mainIndex,
    );
  }

  /**
   * Check if this selection set equals another
   */
  equals(other: SelectionSet): boolean {
    if (this.ranges.length !== other.ranges.length) {
      return false;
    }
    if (this.mainIndex !== other.mainIndex) {
      return false;
    }
    return this.ranges.every((r, i) => r.equals(other.ranges[i]!));
  }
}
