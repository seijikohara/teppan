/**
 * Represents a single text change
 */
export class Change {
  /** Start offset of the change */
  readonly from: number;
  /** End offset of the original text being replaced */
  readonly to: number;
  /** The text being inserted */
  readonly insert: string;

  constructor(from: number, to: number, insert: string) {
    this.from = from;
    this.to = to;
    this.insert = insert;
  }

  /**
   * Create an insertion change
   */
  static insert(offset: number, text: string): Change {
    return new Change(offset, offset, text);
  }

  /**
   * Create a deletion change
   */
  static delete(from: number, to: number): Change {
    return new Change(from, to, "");
  }

  /**
   * Create a replacement change
   */
  static replace(from: number, to: number, text: string): Change {
    return new Change(from, to, text);
  }

  /**
   * The length of the deleted text
   */
  get deleteLength(): number {
    return this.to - this.from;
  }

  /**
   * The length of the inserted text
   */
  get insertLength(): number {
    return this.insert.length;
  }

  /**
   * The net change in document length
   */
  get lengthDelta(): number {
    return this.insertLength - this.deleteLength;
  }

  /**
   * Check if this is a pure insertion (no deletion)
   */
  get isInsertion(): boolean {
    return this.from === this.to && this.insert.length > 0;
  }

  /**
   * Check if this is a pure deletion (no insertion)
   */
  get isDeletion(): boolean {
    return this.to > this.from && this.insert.length === 0;
  }

  /**
   * Check if this change has no effect
   */
  get isEmpty(): boolean {
    return this.from === this.to && this.insert.length === 0;
  }
}

/**
 * Represents a set of changes to be applied to a document
 */
export class ChangeSet {
  /** The changes in this set, sorted by position */
  readonly changes: readonly Change[];
  /** The length of the original document */
  readonly originalLength: number;

  constructor(changes: readonly Change[], originalLength: number) {
    this.changes = changes;
    this.originalLength = originalLength;
  }

  /**
   * Create an empty change set
   */
  static empty(length: number): ChangeSet {
    return new ChangeSet([], length);
  }

  /**
   * Create a change set from a single change
   */
  static of(change: Change, originalLength: number): ChangeSet {
    return new ChangeSet([change], originalLength);
  }

  /**
   * Check if this change set has no changes
   */
  get isEmpty(): boolean {
    return this.changes.length === 0;
  }

  /**
   * Get the new document length after applying changes
   */
  get newLength(): number {
    let length = this.originalLength;
    for (const change of this.changes) {
      length += change.lengthDelta;
    }
    return length;
  }

  /**
   * Map an offset through this change set (before -> after)
   */
  mapOffset(offset: number, assoc: -1 | 1 = 1): number {
    let mapped = offset;
    let delta = 0;

    for (const change of this.changes) {
      if (change.from > offset) break;

      if (change.from <= offset && change.to >= offset) {
        // Position is inside a replaced region
        if (assoc < 0) {
          mapped = change.from + delta;
        } else {
          mapped = change.from + delta + change.insertLength;
        }
      } else if (change.to <= offset) {
        // Position is after this change
        delta += change.lengthDelta;
        mapped = offset + delta;
      }
    }

    return mapped;
  }

  /**
   * Compose this change set with another
   * Returns a change set that has the same effect as applying this, then other
   */
  compose(other: ChangeSet): ChangeSet {
    if (this.isEmpty) return other;
    if (other.isEmpty) return this;

    // For simplicity, we'll just concatenate and adjust
    // A full implementation would merge overlapping changes
    const mappedOther = other.changes.map((change) => {
      const from = this.mapOffset(change.from, -1);
      const to = this.mapOffset(change.to, 1);
      return new Change(from, to, change.insert);
    });

    return new ChangeSet(
      [...this.changes, ...mappedOther],
      this.originalLength,
    );
  }

  /**
   * Invert this change set (for undo)
   * Requires the original document text
   */
  invert(originalDoc: string): ChangeSet {
    const inverted: Change[] = [];

    for (const change of this.changes) {
      const deletedText = originalDoc.slice(change.from, change.to);
      inverted.push(
        new Change(change.from, change.from + change.insertLength, deletedText),
      );
    }

    return new ChangeSet(inverted, this.newLength);
  }

  /**
   * Iterate over the changes
   */
  [Symbol.iterator](): Iterator<Change> {
    return this.changes[Symbol.iterator]();
  }
}
