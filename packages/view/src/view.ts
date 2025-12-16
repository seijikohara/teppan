import {
  EditorState,
  type EditorStateConfig,
  type Extension,
  SelectionSet,
  type Transaction,
  createPosition,
} from "@teppan/state";
import { DecorationSet, collectDecorations } from "./decoration";
import {
  CSS,
  clearElement,
  createEditorDOM,
  createElement,
  createTextNode,
  measureCharSize,
  setStyles,
} from "./dom";
import { InputHandler, defaultKeymap, IS_MAC } from "./input";
import { ViewportManager, getVisibleLines } from "./viewport";
import { SearchPanel, type SearchPanelConfig } from "./search-panel";

/**
 * Configuration for creating an EditorView
 */
export interface EditorViewConfig extends EditorStateConfig {
  /** Parent element to mount the editor */
  parent?: HTMLElement;
  /** Whether the editor is read-only */
  readonly?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Line numbers visibility */
  lineNumbers?: boolean;
  /** Tab size (number of spaces) */
  tabSize?: number;
  /** Search panel configuration */
  search?: SearchPanelConfig | boolean;
}

/**
 * The editor view handles DOM rendering and user interaction
 */
export class EditorView {
  /** The current editor state */
  private _state: EditorState;
  /** DOM elements */
  readonly dom: HTMLDivElement;
  readonly scrollerDOM: HTMLDivElement;
  readonly contentDOM: HTMLDivElement;
  readonly gutterDOM: HTMLDivElement;
  private selectionLayerDOM: HTMLDivElement;
  private cursorLayerDOM: HTMLDivElement;

  /** Viewport manager for virtualization */
  private viewport: ViewportManager;
  /** Input handler */
  private inputHandler: InputHandler;
  /** Whether the editor is focused */
  private _hasFocus = false;
  /** Configuration */
  private config: Required<Omit<EditorViewConfig, keyof EditorStateConfig | "search">> & {
    search: SearchPanelConfig | boolean;
  };
  /** Character size cache */
  private charSize: { width: number; height: number } = {
    width: 8,
    height: 20,
  };
  /** Line elements cache */
  private lineElements: Map<number, HTMLElement> = new Map();
  /** Current decorations */
  private decorations: DecorationSet = DecorationSet.empty();
  /** Search panel */
  private searchPanel: SearchPanel | null = null;

  constructor(config: EditorViewConfig = {}) {
    // Initialize configuration
    this.config = {
      parent: config.parent ?? document.body,
      readonly: config.readonly ?? false,
      placeholder: config.placeholder ?? "",
      lineNumbers: config.lineNumbers ?? true,
      tabSize: config.tabSize ?? 2,
      search: config.search ?? true,
    };

    // Add default keymap if not provided
    const extensions: Extension[] = config.extensions ?? [];
    const hasKeymap = extensions.some(
      (ext) => ext.keymap && ext.keymap.length > 0,
    );
    if (!hasKeymap) {
      extensions.push({
        name: "defaultKeymap",
        keymap: defaultKeymap(),
      });
    }

    // Create state
    this._state = EditorState.create({
      doc: config.doc,
      selection: config.selection,
      extensions,
    });

    // Create DOM structure
    const domElements = createEditorDOM();
    this.dom = domElements.wrapper;
    this.scrollerDOM = domElements.scroller;
    this.contentDOM = domElements.content;
    this.gutterDOM = domElements.gutter;
    this.selectionLayerDOM = domElements.selectionLayer;
    this.cursorLayerDOM = domElements.cursorLayer;

    // Apply readonly state
    if (this.config.readonly) {
      this.dom.classList.add(CSS.readonly);
      this.dom.setAttribute("aria-readonly", "true");
    }

    // Initialize viewport
    this.viewport = new ViewportManager({
      lineHeight: this.charSize.height,
    });
    this.viewport.updateFromState(this._state);

    // Initialize input handler
    this.inputHandler = new InputHandler(
      this.dom,
      () => this._state,
      (tr) => this.dispatch(tr),
    );

    // Mount to parent
    this.config.parent.appendChild(this.dom);

    // Measure character size
    this.measureCharSize();

    // Re-measure after fonts are loaded to ensure accurate sizing
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        this.measureCharSize();
        this.render();
      });
    }

    // Set up event listeners
    this.setupEventListeners();

    // Initialize search panel if enabled
    if (this.config.search !== false) {
      const searchConfig =
        typeof this.config.search === "object" ? this.config.search : {};
      this.searchPanel = new SearchPanel(
        this.dom,
        () => this._state,
        (tr) => this.dispatch(tr),
        searchConfig,
      );
      this.searchPanel.setOnClose(() => this.focus());
    }

    // Initial render
    this.render();
  }

  /**
   * Get the current editor state
   */
  get state(): EditorState {
    return this._state;
  }

  /**
   * Check if the editor has focus
   */
  get hasFocus(): boolean {
    return this._hasFocus;
  }

  /**
   * Dispatch a transaction to update the state
   */
  dispatch(transaction: Transaction): void {
    if (this.config.readonly && transaction.docChanged) {
      return; // Ignore document changes in readonly mode
    }

    const newState = this._state.apply(transaction);
    if (newState !== this._state) {
      this._state = newState;
      this.viewport.updateFromState(newState);
      this.render();

      // Scroll selection into view if requested
      if (transaction.scrollIntoView) {
        this.scrollSelectionIntoView();
      }
    }
  }

  /**
   * Focus the editor
   */
  focus(): void {
    this.dom.focus();
  }

  /**
   * Blur the editor
   */
  blur(): void {
    this.dom.blur();
  }

  /**
   * Open the search panel
   */
  openSearch(options?: { showReplace?: boolean }): void {
    this.searchPanel?.open(options);
  }

  /**
   * Close the search panel
   */
  closeSearch(): void {
    this.searchPanel?.close();
  }

  /**
   * Toggle the search panel
   */
  toggleSearch(options?: { showReplace?: boolean }): void {
    this.searchPanel?.toggle(options);
  }

  /**
   * Find the next match
   */
  findNext(): void {
    this.searchPanel?.findNext();
  }

  /**
   * Find the previous match
   */
  findPrevious(): void {
    this.searchPanel?.findPrevious();
  }

  /**
   * Get the search panel instance
   */
  getSearchPanel(): SearchPanel | null {
    return this.searchPanel;
  }

  /**
   * Destroy the editor and clean up
   */
  destroy(): void {
    this.inputHandler.detach();
    this.dom.removeEventListener("focus", this.handleFocus);
    this.dom.removeEventListener("blur", this.handleBlur);
    this.dom.removeEventListener("keydown", this.handleSearchKeyDown);
    this.scrollerDOM.removeEventListener("scroll", this.handleScroll);
    this.contentDOM.removeEventListener("mousedown", this.handleMouseDown);

    this.searchPanel?.destroy();

    if (this.dom.parentElement) {
      this.dom.parentElement.removeChild(this.dom);
    }

    this.lineElements.clear();
  }

  private measureCharSize(): void {
    // Use the main editor DOM which has the font styles applied
    const size = measureCharSize(this.dom);
    if (size.width > 0 && size.height > 0) {
      this.charSize = size;
      this.viewport.setLineHeight(size.height);
    }
  }

  private setupEventListeners(): void {
    this.inputHandler.attach();

    this.dom.addEventListener("focus", this.handleFocus);
    this.dom.addEventListener("blur", this.handleBlur);
    this.dom.addEventListener("keydown", this.handleSearchKeyDown);
    this.scrollerDOM.addEventListener("scroll", this.handleScroll);
    this.contentDOM.addEventListener("mousedown", this.handleMouseDown);

    // Observe resize
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      resizeObserver.observe(this.scrollerDOM);
    }
  }

  private handleFocus = (): void => {
    this._hasFocus = true;
    this.dom.classList.add(CSS.focused);
    this.renderCursor();
  };

  private handleBlur = (): void => {
    this._hasFocus = false;
    this.dom.classList.remove(CSS.focused);
    this.renderCursor();
  };

  private handleSearchKeyDown = (event: KeyboardEvent): void => {
    if (!this.searchPanel) return;

    const key = event.key.toLowerCase();
    const modKey = IS_MAC ? event.metaKey : event.ctrlKey;

    // Cmd/Ctrl+F: Open find panel
    if (modKey && key === "f" && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      this.searchPanel.open({ showReplace: false });
      return;
    }

    // Cmd/Ctrl+H: Open find and replace panel
    if (modKey && key === "h" && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      this.searchPanel.open({ showReplace: true });
      return;
    }

    // F3 or Cmd/Ctrl+G: Find next
    if (
      (key === "f3" && !modKey) ||
      (modKey && key === "g" && !event.shiftKey)
    ) {
      if (this.searchPanel.isOpen()) {
        event.preventDefault();
        event.stopPropagation();
        this.searchPanel.findNext();
      }
      return;
    }

    // Shift+F3 or Cmd/Ctrl+Shift+G: Find previous
    if (
      (key === "f3" && event.shiftKey && !modKey) ||
      (modKey && key === "g" && event.shiftKey)
    ) {
      if (this.searchPanel.isOpen()) {
        event.preventDefault();
        event.stopPropagation();
        this.searchPanel.findPrevious();
      }
      return;
    }

    // Escape: Close search panel
    if (key === "escape" && this.searchPanel.isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.searchPanel.close();
      return;
    }
  };

  private handleScroll = (): void => {
    this.viewport.setScrollTop(this.scrollerDOM.scrollTop);
    this.render();
  };

  private handleResize = (): void => {
    const rect = this.scrollerDOM.getBoundingClientRect();
    this.viewport.setContainerHeight(rect.height);
    this.render();
  };

  private handleMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) return; // Only handle left click

    const pos = this.positionFromMouse(event);
    if (pos) {
      const selection = SelectionSet.cursor(pos);
      const transaction = this._state.transaction({ selection });
      this.dispatch(transaction);
      this.focus();
    }

    event.preventDefault();
  };

  private positionFromMouse(
    event: MouseEvent,
  ): { line: number; column: number } | null {
    const contentRect = this.contentDOM.getBoundingClientRect();
    const x = event.clientX - contentRect.left;
    const y = event.clientY - contentRect.top + this.scrollerDOM.scrollTop;

    const lineNumber = this.viewport.getLineAtY(y);
    const lineInfo = this._state.line(lineNumber);

    if (!lineInfo) return null;

    // Calculate column from x position
    const column = Math.round(x / this.charSize.width);
    const clampedColumn = Math.max(0, Math.min(column, lineInfo.text.length));

    return createPosition(lineNumber, clampedColumn);
  }

  private render(): void {
    // Collect decorations
    this.decorations = collectDecorations(this._state);

    // Render content
    this.renderLines();

    // Render gutter
    if (this.config.lineNumbers) {
      this.renderGutter();
    }

    // Render selection and cursor
    this.renderSelection();
    this.renderCursor();

    // Update total content height for scrolling
    const totalHeight = this.viewport.getTotalHeight();
    setStyles(this.contentDOM, {
      height: `${totalHeight}px`,
    });
  }

  private renderLines(): void {
    const viewport = this.viewport.getViewport();
    const visibleLines = getVisibleLines(this._state, viewport);

    // Track which lines are still visible
    const visibleLineNumbers = new Set(visibleLines.map((l) => l.lineNumber));

    // Remove lines that are no longer visible
    for (const [lineNum, element] of this.lineElements) {
      if (!visibleLineNumbers.has(lineNum)) {
        element.remove();
        this.lineElements.delete(lineNum);
      }
    }

    // Add or update visible lines
    for (const line of visibleLines) {
      let element = this.lineElements.get(line.lineNumber);

      if (!element) {
        element = createElement("div", CSS.line);
        this.lineElements.set(line.lineNumber, element);
        this.contentDOM.appendChild(element);
      }

      // Position the line with padding offset
      const contentPaddingTop = 10;
      const contentPaddingLeft = 12;
      const contentPaddingRight = 12;
      const top = this.viewport.getLineTop(line.lineNumber);
      setStyles(element, {
        position: "absolute",
        top: `${top + contentPaddingTop}px`,
        left: `${contentPaddingLeft}px`,
        right: `${contentPaddingRight}px`,
        height: `${this.charSize.height}px`,
      });

      // Apply line decorations
      const lineDecorations = this.decorations.getForLine(line.lineNumber);
      let className = CSS.line;
      for (const dec of lineDecorations) {
        if (dec.class) {
          className += ` ${dec.class}`;
        }
      }
      element.className = className;

      // Render line content
      this.renderLineContent(element, line.text, line.from);
    }
  }

  private renderLineContent(
    element: HTMLElement,
    text: string,
    lineFrom: number,
  ): void {
    clearElement(element);

    if (text.length === 0) {
      // Empty line - use a zero-width space to maintain height
      element.appendChild(createTextNode("\u200B"));
      return;
    }

    // Get range decorations for this line
    const lineTo = lineFrom + text.length;
    const rangeDecorations = this.decorations
      .getForRange(lineFrom, lineTo)
      .filter(
        (d) => d.type === "range" && d.from !== undefined && d.to !== undefined,
      )
      .sort((a, b) => (a.from ?? 0) - (b.from ?? 0));

    if (rangeDecorations.length === 0) {
      // No decorations, render plain text
      element.appendChild(createTextNode(text));
      return;
    }

    // Render text with decorations
    let currentPos = lineFrom;

    for (const dec of rangeDecorations) {
      const decFrom = Math.max(dec.from ?? lineFrom, lineFrom);
      const decTo = Math.min(dec.to ?? lineTo, lineTo);

      // Skip if decoration is outside line bounds
      if (decFrom >= lineTo || decTo <= lineFrom) {
        continue;
      }

      // Add text before decoration
      if (decFrom > currentPos) {
        const beforeText = text.substring(
          currentPos - lineFrom,
          decFrom - lineFrom,
        );
        element.appendChild(createTextNode(beforeText));
      }

      // Add decorated text
      const decoratedText = text.substring(
        decFrom - lineFrom,
        decTo - lineFrom,
      );
      if (decoratedText.length > 0) {
        const span = createElement("span", dec.class);
        span.appendChild(createTextNode(decoratedText));
        element.appendChild(span);
      }

      currentPos = decTo;
    }

    // Add remaining text after last decoration
    if (currentPos < lineTo) {
      const afterText = text.substring(currentPos - lineFrom);
      element.appendChild(createTextNode(afterText));
    }
  }

  private renderGutter(): void {
    const viewport = this.viewport.getViewport();
    clearElement(this.gutterDOM);

    const gutterPaddingTop = 10;
    const gutterPaddingRight = 10;

    for (let i = viewport.from; i < viewport.to; i++) {
      const element = createElement("div", CSS.gutterElement);
      const top = this.viewport.getLineTop(i);

      setStyles(element, {
        position: "absolute",
        top: `${top + gutterPaddingTop}px`,
        right: `${gutterPaddingRight}px`,
        height: `${this.charSize.height}px`,
        "line-height": `${this.charSize.height}px`,
      });

      element.appendChild(createTextNode(String(i + 1)));
      this.gutterDOM.appendChild(element);
    }

    // Set gutter width based on line count
    const digitCount = String(this._state.lineCount).length;
    const width = (digitCount + 1) * this.charSize.width + 16;
    setStyles(this.gutterDOM, {
      width: `${width}px`,
    });
  }

  private renderSelection(): void {
    clearElement(this.selectionLayerDOM);

    if (!this._hasFocus) return;

    const selection = this._state.selection.main;
    if (selection.isEmpty) return;

    const from = selection.from;
    const to = selection.to;

    // Render selection for each line
    for (let line = from.line; line <= to.line; line++) {
      const lineInfo = this._state.line(line);
      if (!lineInfo) continue;

      const startCol = line === from.line ? from.column : 0;
      const endCol = line === to.line ? to.column : lineInfo.text.length;

      if (startCol === endCol) continue;

      const element = createElement("div", CSS.selection);
      const top = this.viewport.getLineTop(line);
      const left = startCol * this.charSize.width;
      const width = (endCol - startCol) * this.charSize.width;

      setStyles(element, {
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${this.charSize.height}px`,
      });

      this.selectionLayerDOM.appendChild(element);
    }
  }

  private renderCursor(): void {
    clearElement(this.cursorLayerDOM);

    if (!this._hasFocus) return;

    for (const range of this._state.selection.ranges) {
      const pos = range.head;
      const top = this.viewport.getLineTop(pos.line);
      const left = pos.column * this.charSize.width;

      const cursor = createElement("div", CSS.cursor);
      setStyles(cursor, {
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
        height: `${this.charSize.height}px`,
      });

      this.cursorLayerDOM.appendChild(cursor);
    }
  }

  private scrollSelectionIntoView(): void {
    const selection = this._state.selection.main;
    const line = selection.head.line;
    const targetScroll = this.viewport.scrollToLine(line, "nearest");

    if (targetScroll !== this.scrollerDOM.scrollTop) {
      this.scrollerDOM.scrollTop = targetScroll;
    }
  }
}
