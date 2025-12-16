import type { EditorState } from "./state";
import type { Transaction } from "./transaction";

/**
 * A state field holds extension-specific state
 */
export interface StateField<T> {
  /** Unique identifier for this field */
  id: symbol;
  /** Create the initial value for this field */
  create: (state: EditorState) => T;
  /** Update the value when a transaction is applied */
  update: (value: T, transaction: Transaction) => T;
}

/**
 * Create a state field
 */
export function createStateField<T>(config: {
  create: (state: EditorState) => T;
  update: (value: T, transaction: Transaction) => T;
}): StateField<T> {
  return {
    id: Symbol("stateField"),
    create: config.create,
    update: config.update,
  };
}

/**
 * A state effect represents a side effect or annotation on a transaction
 */
export interface StateEffect<T = unknown> {
  /** The effect type */
  type: StateEffectType<T>;
  /** The effect value */
  value: T;
}

/**
 * A state effect type
 */
export interface StateEffectType<T> {
  /** Unique identifier for this effect type */
  id: symbol;
  /** Create an effect of this type */
  of: (value: T) => StateEffect<T>;
}

/**
 * Create a state effect type
 */
export function createStateEffectType<T>(): StateEffectType<T> {
  const id = Symbol("stateEffect");
  return {
    id,
    of: (value: T) => ({ type: { id, of: null! }, value }),
  };
}

/**
 * Filter or modify transactions before they are applied
 */
export type TransactionFilter = (
  transaction: Transaction,
  state: EditorState,
) => Transaction | null;

/**
 * Listen for state updates
 */
export type UpdateListener = (update: {
  state: EditorState;
  prevState: EditorState;
  transaction: Transaction;
}) => void;

/**
 * A key binding specification
 */
export interface KeyBinding {
  /** The key combination (e.g., "Ctrl-S", "Cmd-Z") */
  key: string;
  /** Alternative key for Mac (if different) */
  mac?: string;
  /** The command to run */
  run: (state: EditorState) => Transaction | null;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Provides decorations for the view
 */
export type DecorationProvider = (state: EditorState) => Decoration[];

/**
 * A decoration to be applied to the view
 */
export interface Decoration {
  /** Type of decoration */
  type: "line" | "range" | "widget";
  /** Start offset (for range decorations) */
  from?: number;
  /** End offset (for range decorations) */
  to?: number;
  /** Line number (for line decorations) */
  line?: number;
  /** CSS class to apply */
  class?: string;
  /** Additional attributes */
  attributes?: Record<string, string>;
}

/**
 * An extension adds functionality to the editor
 */
export interface Extension {
  /** Unique name for this extension */
  name: string;

  /** State fields provided by this extension */
  stateFields?: StateField<unknown>[];

  /** Transaction filters */
  transactionFilters?: TransactionFilter[];

  /** Update listeners */
  updateListeners?: UpdateListener[];

  /** Key bindings */
  keymap?: KeyBinding[];

  /** Decoration providers */
  decorationProviders?: DecorationProvider[];

  /** Sub-extensions */
  extensions?: Extension[];
}

/**
 * Flatten and combine multiple extensions
 */
export function combineExtensions(extensions: Extension[]): {
  stateFields: StateField<unknown>[];
  transactionFilters: TransactionFilter[];
  updateListeners: UpdateListener[];
  keymap: KeyBinding[];
  decorationProviders: DecorationProvider[];
} {
  const result = {
    stateFields: [] as StateField<unknown>[],
    transactionFilters: [] as TransactionFilter[],
    updateListeners: [] as UpdateListener[],
    keymap: [] as KeyBinding[],
    decorationProviders: [] as DecorationProvider[],
  };

  function processExtension(ext: Extension): void {
    if (ext.stateFields) {
      result.stateFields.push(...ext.stateFields);
    }
    if (ext.transactionFilters) {
      result.transactionFilters.push(...ext.transactionFilters);
    }
    if (ext.updateListeners) {
      result.updateListeners.push(...ext.updateListeners);
    }
    if (ext.keymap) {
      result.keymap.push(...ext.keymap);
    }
    if (ext.decorationProviders) {
      result.decorationProviders.push(...ext.decorationProviders);
    }
    if (ext.extensions) {
      for (const subExt of ext.extensions) {
        processExtension(subExt);
      }
    }
  }

  for (const ext of extensions) {
    processExtension(ext);
  }

  return result;
}
