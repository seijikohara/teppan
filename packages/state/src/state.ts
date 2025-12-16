import type { ChangeSet } from "./changeset";
import {
  type DecorationProvider,
  type Extension,
  type KeyBinding,
  type StateField,
  type TransactionFilter,
  type UpdateListener,
  combineExtensions,
} from "./extension";
import { createPosition } from "./position";
import { SelectionSet } from "./selection";
import { Transaction, type TransactionSpec } from "./transaction";

/**
 * Configuration for creating an EditorState
 */
export interface EditorStateConfig {
  /** Initial document content */
  doc?: string;
  /** Initial selection */
  selection?: SelectionSet;
  /** Extensions to load */
  extensions?: Extension[];
}

/**
 * The editor state holds all state for the editor
 */
export class EditorState {
  /** The document content */
  readonly doc: string;
  /** The current selection */
  readonly selection: SelectionSet;
  /** State field values */
  private readonly fieldValues: Map<symbol, unknown>;
  /** Combined extension data */
  private readonly extensionData: {
    stateFields: StateField<unknown>[];
    transactionFilters: TransactionFilter[];
    updateListeners: UpdateListener[];
    keymap: KeyBinding[];
    decorationProviders: DecorationProvider[];
  };

  private constructor(
    doc: string,
    selection: SelectionSet,
    fieldValues: Map<symbol, unknown>,
    extensionData: ReturnType<typeof combineExtensions>,
  ) {
    this.doc = doc;
    this.selection = selection;
    this.fieldValues = fieldValues;
    this.extensionData = extensionData;
  }

  /**
   * Create a new editor state
   */
  static create(config: EditorStateConfig = {}): EditorState {
    const doc = config.doc ?? "";
    const selection =
      config.selection ?? SelectionSet.cursor(createPosition(0, 0));
    const extensionData = combineExtensions(config.extensions ?? []);

    const fieldValues = new Map<symbol, unknown>();
    const state = new EditorState(doc, selection, fieldValues, extensionData);

    // Initialize state fields
    for (const field of extensionData.stateFields) {
      fieldValues.set(field.id, field.create(state));
    }

    return state;
  }

  /**
   * Get the document length
   */
  get length(): number {
    return this.doc.length;
  }

  /**
   * Get the number of lines
   */
  get lineCount(): number {
    return this.doc.split("\n").length;
  }

  /**
   * Get a state field value
   */
  field<T>(field: StateField<T>): T {
    const value = this.fieldValues.get(field.id);
    if (value === undefined) {
      throw new Error("State field not found");
    }
    return value as T;
  }

  /**
   * Get a line by number (0-indexed)
   */
  line(n: number): { text: string; from: number; to: number } | undefined {
    const lines = this.doc.split("\n");
    if (n < 0 || n >= lines.length) {
      return undefined;
    }

    let from = 0;
    for (let i = 0; i < n; i++) {
      from += lines[i]!.length + 1;
    }

    const text = lines[n]!;
    return {
      text,
      from,
      to: from + text.length,
    };
  }

  /**
   * Get text in a range
   */
  sliceDoc(from: number, to?: number): string {
    return this.doc.slice(from, to);
  }

  /**
   * Get the keymap
   */
  get keymap(): readonly KeyBinding[] {
    return this.extensionData.keymap;
  }

  /**
   * Get decoration providers
   */
  get decorationProviders(): readonly DecorationProvider[] {
    return this.extensionData.decorationProviders;
  }

  /**
   * Get update listeners
   */
  get updateListeners(): readonly UpdateListener[] {
    return this.extensionData.updateListeners;
  }

  /**
   * Create a transaction
   */
  transaction(spec: TransactionSpec): Transaction {
    return Transaction.create(this.length, spec);
  }

  /**
   * Apply a transaction and return a new state
   */
  apply(tr: Transaction): EditorState {
    // Apply transaction filters
    let filteredTr: Transaction | null = tr;
    for (const filter of this.extensionData.transactionFilters) {
      filteredTr = filter(filteredTr, this);
      if (!filteredTr) {
        return this; // Transaction was rejected
      }
    }

    // Apply document changes
    let newDoc = this.doc;
    if (filteredTr.docChanged) {
      newDoc = this.applyChanges(filteredTr.changes);
    }

    // Apply selection change
    const newSelection =
      filteredTr.selection ?? this.mapSelection(filteredTr.changes);

    // Update state fields
    const newFieldValues = new Map<symbol, unknown>();
    for (const field of this.extensionData.stateFields) {
      const oldValue = this.fieldValues.get(field.id);
      newFieldValues.set(field.id, field.update(oldValue, filteredTr));
    }

    const newState = new EditorState(
      newDoc,
      newSelection,
      newFieldValues,
      this.extensionData,
    );

    // Notify update listeners
    for (const listener of this.extensionData.updateListeners) {
      listener({
        state: newState,
        prevState: this,
        transaction: filteredTr,
      });
    }

    return newState;
  }

  private applyChanges(changes: ChangeSet): string {
    let result = this.doc;
    let offset = 0;

    for (const change of changes) {
      const from = change.from + offset;
      const to = change.to + offset;
      result = result.slice(0, from) + change.insert + result.slice(to);
      offset += change.lengthDelta;
    }

    return result;
  }

  private mapSelection(changes: ChangeSet): SelectionSet {
    if (changes.isEmpty) {
      return this.selection;
    }

    return this.selection.map((pos) => {
      const offset = this.positionToOffset(pos);
      const newOffset = changes.mapOffset(offset);
      return this.offsetToPosition(newOffset);
    });
  }

  /**
   * Convert position to offset
   */
  positionToOffset(pos: { line: number; column: number }): number {
    const lines = this.doc.split("\n");
    let offset = 0;

    for (let i = 0; i < pos.line && i < lines.length; i++) {
      offset += lines[i]!.length + 1;
    }

    const lineLength = lines[pos.line]?.length ?? 0;
    offset += Math.min(pos.column, lineLength);

    return Math.min(offset, this.doc.length);
  }

  /**
   * Convert offset to position
   */
  offsetToPosition(offset: number): { line: number; column: number } {
    const clamped = Math.max(0, Math.min(offset, this.doc.length));
    const lines = this.doc.split("\n");

    let currentOffset = 0;
    for (let line = 0; line < lines.length; line++) {
      const lineLength = lines[line]!.length;
      if (currentOffset + lineLength >= clamped) {
        return { line, column: clamped - currentOffset };
      }
      currentOffset += lineLength + 1;
    }

    return {
      line: lines.length - 1,
      column: lines[lines.length - 1]?.length ?? 0,
    };
  }
}
