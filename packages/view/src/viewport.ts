import type { EditorState } from "@teppan/state";

/**
 * Represents the visible portion of the document
 */
export interface Viewport {
  /** First visible line (0-indexed) */
  from: number;
  /** Last visible line (exclusive) */
  to: number;
  /** Scroll offset from the top */
  top: number;
}

/**
 * Configuration for viewport management
 */
export interface ViewportConfig {
  /** Line height in pixels */
  lineHeight: number;
  /** Number of lines to render above/below the visible area */
  overscan: number;
  /** Padding at the top of the content */
  paddingTop: number;
  /** Padding at the bottom of the content */
  paddingBottom: number;
}

const DEFAULT_CONFIG: ViewportConfig = {
  lineHeight: 20,
  overscan: 5,
  paddingTop: 4,
  paddingBottom: 4,
};

/**
 * Manages the visible viewport and virtualized rendering
 */
export class ViewportManager {
  private config: ViewportConfig;
  private containerHeight = 0;
  private scrollTop = 0;
  private lineCount = 0;

  constructor(config: Partial<ViewportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update the container dimensions
   */
  setContainerHeight(height: number): void {
    this.containerHeight = height;
  }

  /**
   * Update the scroll position
   */
  setScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  /**
   * Update the line count from state
   */
  setLineCount(count: number): void {
    this.lineCount = count;
  }

  /**
   * Get the current viewport
   */
  getViewport(): Viewport {
    const { lineHeight, overscan, paddingTop } = this.config;

    // Calculate visible line range
    const visibleTop = Math.max(0, this.scrollTop - paddingTop);
    const visibleBottom = this.scrollTop + this.containerHeight;

    const fromLine = Math.max(
      0,
      Math.floor(visibleTop / lineHeight) - overscan,
    );
    const toLine = Math.min(
      this.lineCount,
      Math.ceil(visibleBottom / lineHeight) + overscan,
    );

    return {
      from: fromLine,
      to: toLine,
      top: this.scrollTop,
    };
  }

  /**
   * Get the total height of the content
   */
  getTotalHeight(): number {
    const { lineHeight, paddingTop, paddingBottom } = this.config;
    return this.lineCount * lineHeight + paddingTop + paddingBottom;
  }

  /**
   * Get the top offset for a line
   */
  getLineTop(lineNumber: number): number {
    return lineNumber * this.config.lineHeight + this.config.paddingTop;
  }

  /**
   * Get the line number at a given y position
   */
  getLineAtY(y: number): number {
    const adjustedY = y - this.config.paddingTop;
    const line = Math.floor(adjustedY / this.config.lineHeight);
    return Math.max(0, Math.min(line, this.lineCount - 1));
  }

  /**
   * Check if a line is in the current viewport
   */
  isLineVisible(lineNumber: number): boolean {
    const viewport = this.getViewport();
    return lineNumber >= viewport.from && lineNumber < viewport.to;
  }

  /**
   * Calculate scroll position to bring a line into view
   */
  scrollToLine(
    lineNumber: number,
    position: "start" | "center" | "end" | "nearest" = "nearest",
  ): number {
    const lineTop = this.getLineTop(lineNumber);
    const lineBottom = lineTop + this.config.lineHeight;
    const viewportTop = this.scrollTop;
    const viewportBottom = this.scrollTop + this.containerHeight;

    switch (position) {
      case "start":
        return lineTop - this.config.paddingTop;

      case "center":
        return lineTop - this.containerHeight / 2 + this.config.lineHeight / 2;

      case "end":
        return lineBottom - this.containerHeight + this.config.paddingBottom;
      default:
        if (lineTop < viewportTop) {
          return lineTop - this.config.paddingTop;
        }
        if (lineBottom > viewportBottom) {
          return lineBottom - this.containerHeight + this.config.paddingBottom;
        }
        return this.scrollTop;
    }
  }

  /**
   * Get the line height
   */
  get lineHeight(): number {
    return this.config.lineHeight;
  }

  /**
   * Set the line height
   */
  setLineHeight(height: number): void {
    this.config.lineHeight = height;
  }

  /**
   * Update from editor state
   */
  updateFromState(state: EditorState): void {
    this.setLineCount(state.lineCount);
  }
}

/**
 * Calculate which lines need to be rendered based on viewport
 */
export function getVisibleLines(
  state: EditorState,
  viewport: Viewport,
): { lineNumber: number; text: string; from: number; to: number }[] {
  const lines: {
    lineNumber: number;
    text: string;
    from: number;
    to: number;
  }[] = [];

  for (let i = viewport.from; i < viewport.to; i++) {
    const lineInfo = state.line(i);
    if (lineInfo) {
      lines.push({
        lineNumber: i,
        text: lineInfo.text,
        from: lineInfo.from,
        to: lineInfo.to,
      });
    }
  }

  return lines;
}
