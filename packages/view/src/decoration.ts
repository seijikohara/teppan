import type { Decoration, EditorState } from "@teppan/state";

/**
 * A set of decorations for a document
 */
export class DecorationSet {
  private readonly decorations: Decoration[];

  constructor(decorations: Decoration[] = []) {
    this.decorations = decorations;
  }

  /**
   * Create an empty decoration set
   */
  static empty(): DecorationSet {
    return new DecorationSet([]);
  }

  /**
   * Create a decoration set from an array of decorations
   */
  static of(decorations: Decoration[]): DecorationSet {
    return new DecorationSet(decorations);
  }

  /**
   * Get all decorations
   */
  get all(): readonly Decoration[] {
    return this.decorations;
  }

  /**
   * Check if the set is empty
   */
  get isEmpty(): boolean {
    return this.decorations.length === 0;
  }

  /**
   * Get decorations for a specific line
   */
  getForLine(lineNumber: number): Decoration[] {
    return this.decorations.filter(
      (d) => d.type === "line" && d.line === lineNumber,
    );
  }

  /**
   * Get range decorations that overlap with a given range
   */
  getForRange(from: number, to: number): Decoration[] {
    return this.decorations.filter((d) => {
      if (d.type !== "range" || d.from === undefined || d.to === undefined) {
        return false;
      }
      return d.from < to && d.to > from;
    });
  }

  /**
   * Get widget decorations at a specific position
   */
  getWidgetsAt(offset: number): Decoration[] {
    return this.decorations.filter(
      (d) => d.type === "widget" && d.from === offset,
    );
  }

  /**
   * Add decorations to this set
   */
  add(decorations: Decoration[]): DecorationSet {
    return new DecorationSet([...this.decorations, ...decorations]);
  }

  /**
   * Filter decorations
   */
  filter(predicate: (decoration: Decoration) => boolean): DecorationSet {
    return new DecorationSet(this.decorations.filter(predicate));
  }
}

/**
 * Collect all decorations from the editor state
 */
export function collectDecorations(state: EditorState): DecorationSet {
  const allDecorations: Decoration[] = [];

  for (const provider of state.decorationProviders) {
    const decorations = provider(state);
    allDecorations.push(...decorations);
  }

  return DecorationSet.of(allDecorations);
}

/**
 * Create a line decoration
 */
export function lineDecoration(
  lineNumber: number,
  options: { class?: string; attributes?: Record<string, string> },
): Decoration {
  return {
    type: "line",
    line: lineNumber,
    class: options.class,
    attributes: options.attributes,
  };
}

/**
 * Create a range decoration
 */
export function rangeDecoration(
  from: number,
  to: number,
  options: { class?: string; attributes?: Record<string, string> },
): Decoration {
  return {
    type: "range",
    from,
    to,
    class: options.class,
    attributes: options.attributes,
  };
}

/**
 * Create a widget decoration
 */
export function widgetDecoration(
  offset: number,
  options: { class?: string; attributes?: Record<string, string> },
): Decoration {
  return {
    type: "widget",
    from: offset,
    class: options.class,
    attributes: options.attributes,
  };
}

/**
 * Decoration builder for convenient creation
 */
export class DecorationBuilder {
  private decorations: Decoration[] = [];

  /**
   * Add a line decoration
   */
  line(
    lineNumber: number,
    options: { class?: string; attributes?: Record<string, string> } = {},
  ): this {
    this.decorations.push(lineDecoration(lineNumber, options));
    return this;
  }

  /**
   * Add a range decoration
   */
  range(
    from: number,
    to: number,
    options: { class?: string; attributes?: Record<string, string> } = {},
  ): this {
    this.decorations.push(rangeDecoration(from, to, options));
    return this;
  }

  /**
   * Add a widget decoration
   */
  widget(
    offset: number,
    options: { class?: string; attributes?: Record<string, string> } = {},
  ): this {
    this.decorations.push(widgetDecoration(offset, options));
    return this;
  }

  /**
   * Build the decoration set
   */
  build(): DecorationSet {
    return DecorationSet.of(this.decorations);
  }
}

/**
 * Create a new decoration builder
 */
export function builder(): DecorationBuilder {
  return new DecorationBuilder();
}
