import { Change, ChangeSet } from "./changeset";
import type { StateEffect } from "./extension";
import type { SelectionSet } from "./selection";

/**
 * Specification for creating a change
 */
export type ChangeSpec =
  | { from: number; to?: number; insert?: string }
  | { from: number; insert: string }
  | Change;

/**
 * Specification for creating a transaction
 */
export interface TransactionSpec {
  /** Changes to apply */
  changes?: ChangeSpec | ChangeSpec[];
  /** New selection */
  selection?: SelectionSet;
  /** State effects */
  effects?: StateEffect | StateEffect[];
  /** Annotations */
  annotations?: Map<string, unknown>;
  /** Whether to scroll the selection into view */
  scrollIntoView?: boolean;
  /** User event type (e.g., "input", "delete", "paste") */
  userEvent?: string;
}

/**
 * A transaction represents a state change
 */
export class Transaction {
  /** The changes in this transaction */
  readonly changes: ChangeSet;
  /** The new selection (if changed) */
  readonly selection: SelectionSet | undefined;
  /** State effects */
  readonly effects: readonly StateEffect[];
  /** Annotations */
  readonly annotations: Map<string, unknown>;
  /** Whether to scroll the selection into view */
  readonly scrollIntoView: boolean;
  /** User event type */
  readonly userEvent: string | undefined;

  constructor(
    changes: ChangeSet,
    selection: SelectionSet | undefined,
    effects: readonly StateEffect[],
    annotations: Map<string, unknown>,
    scrollIntoView: boolean,
    userEvent: string | undefined,
  ) {
    this.changes = changes;
    this.selection = selection;
    this.effects = effects;
    this.annotations = annotations;
    this.scrollIntoView = scrollIntoView;
    this.userEvent = userEvent;
  }

  /**
   * Create a transaction from a specification
   */
  static create(docLength: number, spec: TransactionSpec): Transaction {
    const changes = Transaction.normalizeChanges(spec.changes, docLength);
    const effects = spec.effects
      ? Array.isArray(spec.effects)
        ? spec.effects
        : [spec.effects]
      : [];
    const annotations = spec.annotations ?? new Map();

    return new Transaction(
      changes,
      spec.selection,
      effects,
      annotations,
      spec.scrollIntoView ?? false,
      spec.userEvent,
    );
  }

  private static normalizeChanges(
    changes: ChangeSpec | ChangeSpec[] | undefined,
    docLength: number,
  ): ChangeSet {
    if (!changes) {
      return ChangeSet.empty(docLength);
    }

    const changeArray = Array.isArray(changes) ? changes : [changes];
    const normalized: Change[] = [];

    for (const spec of changeArray) {
      if (spec instanceof Change) {
        normalized.push(spec);
      } else {
        const from = spec.from;
        const to = "to" in spec && spec.to !== undefined ? spec.to : spec.from;
        const insert =
          "insert" in spec && spec.insert !== undefined ? spec.insert : "";
        normalized.push(new Change(from, to, insert));
      }
    }

    // Sort changes by position
    normalized.sort((a, b) => a.from - b.from);

    return new ChangeSet(normalized, docLength);
  }

  /**
   * Check if this transaction has any changes
   */
  get docChanged(): boolean {
    return !this.changes.isEmpty;
  }

  /**
   * Check if this transaction has a selection change
   */
  get selectionChanged(): boolean {
    return this.selection !== undefined;
  }

  /**
   * Get an annotation value
   */
  annotation<T>(key: string): T | undefined {
    return this.annotations.get(key) as T | undefined;
  }

  /**
   * Check if this transaction is a user input event
   */
  get isUserEvent(): boolean {
    return this.userEvent !== undefined;
  }
}
