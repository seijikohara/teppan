import {
  type EditorState,
  type SearchQuery,
  type SearchMatch,
  type Transaction,
  searchInDocument,
  findNearestMatch,
  replaceMatch,
  replaceAllMatches,
  SelectionSet,
} from "@teppan/state";
import { createElement } from "./dom";

/**
 * CSS classes for search panel
 */
export const SearchCSS = {
  panel: "teppan-search-panel",
  panelOpen: "teppan-search-panel-open",
  row: "teppan-search-row",
  inputGroup: "teppan-search-input-group",
  input: "teppan-search-input",
  replaceInput: "teppan-replace-input",
  button: "teppan-search-btn",
  buttonIcon: "teppan-search-btn-icon",
  buttonPrimary: "teppan-search-btn-primary",
  toggle: "teppan-search-toggle",
  toggleActive: "teppan-search-toggle-active",
  info: "teppan-search-info",
  close: "teppan-search-close",
  expandBtn: "teppan-search-expand",
  match: "teppan-search-match",
  matchCurrent: "teppan-search-match-current",
  noResults: "teppan-search-no-results",
} as const;

/**
 * Search panel configuration
 */
export interface SearchPanelConfig {
  /** Whether to show the replace UI */
  showReplace?: boolean;
}

/**
 * Search panel state
 */
export interface SearchPanelState {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Current search query */
  query: SearchQuery;
  /** All matches */
  matches: SearchMatch[];
  /** Current match index */
  currentMatchIndex: number;
  /** Whether to show the replace UI */
  showReplace: boolean;
}

/**
 * Create initial search panel state
 */
export function createSearchPanelState(
  config?: SearchPanelConfig,
): SearchPanelState {
  return {
    isOpen: false,
    query: {
      search: "",
      replace: "",
      caseSensitive: false,
      wholeWord: false,
      regexp: false,
    },
    matches: [],
    currentMatchIndex: -1,
    showReplace: config?.showReplace ?? false,
  };
}

// SVG Icons
const Icons = {
  prev: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4l-4 4 4 4V4z" transform="rotate(-90 8 8)"/></svg>`,
  next: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4l-4 4 4 4V4z" transform="rotate(90 8 8)"/></svg>`,
  close: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>`,
  expand: `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>`,
  collapse: `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/></svg>`,
  caseSensitive: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><text x="2" y="12" font-size="10" font-weight="bold" font-family="system-ui">Aa</text></svg>`,
  wholeWord: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><text x="1" y="11" font-size="8" font-weight="bold" font-family="system-ui">ab</text><rect x="0" y="12" width="16" height="1"/></svg>`,
  regex: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><text x="2" y="12" font-size="10" font-weight="bold" font-family="monospace">.*</text></svg>`,
  replace: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V2H5v3.5a.5.5 0 0 1-1 0v-4A.5.5 0 0 1 4.5 1h7zM4.5 15a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 1 0V14h6v-3.5a.5.5 0 0 1 1 0v4a.5.5 0 0 1-.5.5h-7z"/><path d="M8 5.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z"/><path d="M10.354 8.354a.5.5 0 0 0 0-.708l-2-2a.5.5 0 1 0-.708.708L9.293 8l-1.647 1.646a.5.5 0 0 0 .708.708l2-2z"/></svg>`,
  replaceAll: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2v4H1V2h2zm0 8v4H1v-4h2zm12-8v4h-2V2h2zm0 8v4h-2v-4h2z"/><path d="M8 5.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z"/><path d="M10.354 8.354a.5.5 0 0 0 0-.708l-2-2a.5.5 0 1 0-.708.708L9.293 8l-1.647 1.646a.5.5 0 0 0 .708.708l2-2z"/></svg>`,
};

/**
 * Search panel controller
 */
export class SearchPanel {
  private container: HTMLElement;
  private panelElement: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private replaceInput: HTMLInputElement | null = null;
  private infoElement: HTMLSpanElement | null = null;
  private expandBtn: HTMLButtonElement | null = null;
  private replaceRow: HTMLDivElement | null = null;

  private toggleButtons: Map<string, HTMLButtonElement> = new Map();

  private state: SearchPanelState;
  private getEditorState: () => EditorState;
  private dispatch: (tr: Transaction) => void;
  private onClose?: () => void;

  constructor(
    container: HTMLElement,
    getEditorState: () => EditorState,
    dispatch: (tr: Transaction) => void,
    config?: SearchPanelConfig,
  ) {
    this.container = container;
    this.getEditorState = getEditorState;
    this.dispatch = dispatch;
    this.state = createSearchPanelState(config);
  }

  /**
   * Open the search panel
   */
  open(options?: { showReplace?: boolean }): void {
    if (options?.showReplace !== undefined) {
      this.state.showReplace = options.showReplace;
    }

    if (!this.panelElement) {
      this.createPanel();
    }

    this.state.isOpen = true;
    this.panelElement!.classList.add(SearchCSS.panelOpen);
    this.updateReplaceVisibility();

    // Focus search input
    setTimeout(() => {
      this.searchInput?.focus();
      this.searchInput?.select();
    }, 0);

    // If there's a selection, use it as the search term
    const editorState = this.getEditorState();
    const mainSelection = editorState.selection.main;
    if (!mainSelection.isEmpty) {
      const from = editorState.positionToOffset(mainSelection.from);
      const to = editorState.positionToOffset(mainSelection.to);
      const selectedText = editorState.sliceDoc(from, to);
      if (selectedText && !selectedText.includes("\n")) {
        this.searchInput!.value = selectedText;
        this.state.query.search = selectedText;
        this.performSearch();
      }
    }
  }

  /**
   * Close the search panel
   */
  close(): void {
    this.state.isOpen = false;
    this.panelElement?.classList.remove(SearchCSS.panelOpen);
    this.clearHighlights();
    this.onClose?.();
  }

  /**
   * Toggle the search panel
   */
  toggle(options?: { showReplace?: boolean }): void {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open(options);
    }
  }

  /**
   * Check if the panel is open
   */
  isOpen(): boolean {
    return this.state.isOpen;
  }

  /**
   * Set the close callback
   */
  setOnClose(callback: () => void): void {
    this.onClose = callback;
  }

  /**
   * Get the current matches
   */
  getMatches(): SearchMatch[] {
    return this.state.matches;
  }

  /**
   * Get the current match index
   */
  getCurrentMatchIndex(): number {
    return this.state.currentMatchIndex;
  }

  /**
   * Get the current query
   */
  getQuery(): SearchQuery {
    return { ...this.state.query };
  }

  /**
   * Find next match
   */
  findNext(): void {
    if (this.state.matches.length === 0) return;

    const editorState = this.getEditorState();
    const currentOffset = editorState.positionToOffset(
      editorState.selection.main.head,
    );

    const nextIndex = findNearestMatch(
      this.state.matches,
      currentOffset + 1,
      "forward",
    );
    this.selectMatchIndex(nextIndex);
  }

  /**
   * Find previous match
   */
  findPrevious(): void {
    if (this.state.matches.length === 0) return;

    const editorState = this.getEditorState();
    const currentOffset = editorState.positionToOffset(
      editorState.selection.main.head,
    );

    const prevIndex = findNearestMatch(
      this.state.matches,
      currentOffset - 1,
      "backward",
    );
    this.selectMatchIndex(prevIndex);
  }

  /**
   * Replace the current match
   */
  replaceCurrent(): void {
    if (
      this.state.currentMatchIndex < 0 ||
      this.state.currentMatchIndex >= this.state.matches.length
    ) {
      return;
    }

    const match = this.state.matches[this.state.currentMatchIndex]!;
    const replacement = this.state.query.replace ?? "";
    const editorState = this.getEditorState();

    const tr = replaceMatch(editorState, match, replacement);
    this.dispatch(tr);

    // Re-run search after replacement
    setTimeout(() => {
      this.performSearch();
      // Move to next match if available
      if (this.state.matches.length > 0) {
        const nextIndex = Math.min(
          this.state.currentMatchIndex,
          this.state.matches.length - 1,
        );
        this.selectMatchIndex(nextIndex);
      }
    }, 0);
  }

  /**
   * Replace all matches
   */
  replaceAll(): void {
    if (this.state.matches.length === 0) return;

    const replacement = this.state.query.replace ?? "";
    const editorState = this.getEditorState();

    const tr = replaceAllMatches(editorState, this.state.matches, replacement);
    this.dispatch(tr);

    // Re-run search after replacement
    setTimeout(() => {
      this.performSearch();
    }, 0);
  }

  /**
   * Destroy the panel
   */
  destroy(): void {
    this.panelElement?.remove();
    this.panelElement = null;
  }

  private createPanel(): void {
    // Inject styles if not already present
    this.injectStyles();

    this.panelElement = createElement("div", SearchCSS.panel);
    this.panelElement.setAttribute("role", "search");

    // Main search row
    const searchRow = createElement("div", SearchCSS.row);

    // Expand/collapse button
    this.expandBtn = createElement("button", SearchCSS.expandBtn, {
      type: "button",
      "aria-label": "Toggle replace",
      title: "Toggle Replace (Ctrl+Shift+H)",
    });
    this.expandBtn.innerHTML = Icons.expand;

    // Input group with search field and toggles
    const inputGroup = createElement("div", SearchCSS.inputGroup);

    this.searchInput = createElement("input", SearchCSS.input, {
      type: "text",
      placeholder: "Search",
      "aria-label": "Search",
      spellcheck: "false",
    });

    // Toggle buttons for options
    const toggleGroup = createElement("div", `${SearchCSS.row}`);
    toggleGroup.style.gap = "2px";

    const caseBtn = this.createToggleButton(
      "caseSensitive",
      Icons.caseSensitive,
      "Match Case (Alt+C)",
    );
    const wordBtn = this.createToggleButton(
      "wholeWord",
      Icons.wholeWord,
      "Match Whole Word (Alt+W)",
    );
    const regexBtn = this.createToggleButton(
      "regexp",
      Icons.regex,
      "Use Regular Expression (Alt+R)",
    );

    toggleGroup.appendChild(caseBtn);
    toggleGroup.appendChild(wordBtn);
    toggleGroup.appendChild(regexBtn);

    inputGroup.appendChild(this.searchInput);
    inputGroup.appendChild(toggleGroup);

    // Navigation and info
    const navGroup = createElement("div", SearchCSS.row);
    navGroup.style.gap = "2px";

    const prevBtn = this.createIconButton(Icons.prev, "Previous Match (Shift+Enter)", () =>
      this.findPrevious(),
    );
    const nextBtn = this.createIconButton(Icons.next, "Next Match (Enter)", () =>
      this.findNext(),
    );

    this.infoElement = createElement("span", SearchCSS.info);

    navGroup.appendChild(prevBtn);
    navGroup.appendChild(nextBtn);
    navGroup.appendChild(this.infoElement);

    // Close button
    const closeBtn = this.createIconButton(Icons.close, "Close (Escape)", () =>
      this.close(),
    );
    closeBtn.classList.add(SearchCSS.close);

    searchRow.appendChild(this.expandBtn);
    searchRow.appendChild(inputGroup);
    searchRow.appendChild(navGroup);
    searchRow.appendChild(closeBtn);

    // Replace row
    this.replaceRow = createElement("div", SearchCSS.row);
    this.replaceRow.setAttribute("data-replace-row", "true");
    this.replaceRow.style.paddingLeft = "26px";

    const replaceInputGroup = createElement("div", SearchCSS.inputGroup);

    this.replaceInput = createElement("input", SearchCSS.replaceInput, {
      type: "text",
      placeholder: "Replace",
      "aria-label": "Replace",
      spellcheck: "false",
    });

    replaceInputGroup.appendChild(this.replaceInput);

    const replaceActions = createElement("div", SearchCSS.row);
    replaceActions.style.gap = "4px";

    const replaceBtn = this.createIconButton(
      Icons.replace,
      "Replace (Enter in replace field)",
      () => this.replaceCurrent(),
    );
    const replaceAllBtn = this.createIconButton(
      Icons.replaceAll,
      "Replace All (Ctrl+Shift+Enter)",
      () => this.replaceAll(),
    );

    replaceActions.appendChild(replaceBtn);
    replaceActions.appendChild(replaceAllBtn);

    this.replaceRow.appendChild(replaceInputGroup);
    this.replaceRow.appendChild(replaceActions);

    this.panelElement.appendChild(searchRow);
    this.panelElement.appendChild(this.replaceRow);

    // Event listeners
    this.setupEventListeners();

    // Insert panel at the top of the container
    this.container.insertBefore(this.panelElement, this.container.firstChild);
  }

  private createIconButton(
    icon: string,
    title: string,
    onClick: () => void,
  ): HTMLButtonElement {
    const btn = createElement("button", SearchCSS.buttonIcon, {
      type: "button",
      title,
      "aria-label": title,
    });
    btn.innerHTML = icon;
    btn.addEventListener("click", onClick);
    return btn;
  }

  private createToggleButton(
    name: keyof SearchQuery,
    icon: string,
    title: string,
  ): HTMLButtonElement {
    const btn = createElement("button", SearchCSS.toggle, {
      type: "button",
      title,
      "aria-label": title,
      "data-option": name,
    });
    btn.innerHTML = icon;

    if (this.state.query[name]) {
      btn.classList.add(SearchCSS.toggleActive);
    }

    btn.addEventListener("click", () => {
      const currentValue = this.state.query[name];
      (this.state.query as unknown as Record<string, unknown>)[name] =
        !currentValue;
      btn.classList.toggle(SearchCSS.toggleActive, !currentValue);
      this.performSearch();
    });

    this.toggleButtons.set(name, btn);
    return btn;
  }

  private setupEventListeners(): void {
    // Prevent all keyboard events from propagating to the editor
    // This must be done on the panel element to catch all events
    const stopKeyPropagation = (e: KeyboardEvent) => {
      e.stopPropagation();
    };

    // Stop propagation on the entire panel
    this.panelElement!.addEventListener("keydown", stopKeyPropagation, true);
    this.panelElement!.addEventListener("keyup", stopKeyPropagation, true);
    this.panelElement!.addEventListener("keypress", stopKeyPropagation, true);

    // Search input events
    this.searchInput!.addEventListener("input", () => {
      this.state.query.search = this.searchInput!.value;
      this.performSearch();
    });

    this.searchInput!.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          this.findPrevious();
        } else {
          this.findNext();
        }
      } else if (e.key === "Escape") {
        this.close();
      } else if (e.altKey) {
        this.handleOptionShortcut(e);
      }
    });

    // Replace input events
    this.replaceInput!.addEventListener("input", () => {
      this.state.query.replace = this.replaceInput!.value;
    });

    this.replaceInput!.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          this.replaceAll();
        } else {
          this.replaceCurrent();
        }
      } else if (e.key === "Escape") {
        this.close();
      }
    });

    // Expand button
    this.expandBtn!.addEventListener("click", () => {
      this.state.showReplace = !this.state.showReplace;
      this.updateReplaceVisibility();
      if (this.state.showReplace) {
        this.replaceInput?.focus();
      }
    });
  }

  private handleOptionShortcut(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    let option: keyof SearchQuery | null = null;

    if (key === "c") option = "caseSensitive";
    else if (key === "w") option = "wholeWord";
    else if (key === "r") option = "regexp";

    if (option) {
      e.preventDefault();
      const btn = this.toggleButtons.get(option);
      if (btn) {
        btn.click();
      }
    }
  }

  private updateReplaceVisibility(): void {
    if (this.replaceRow) {
      this.replaceRow.style.display = this.state.showReplace ? "flex" : "none";
    }
    if (this.expandBtn) {
      this.expandBtn.innerHTML = this.state.showReplace
        ? Icons.collapse
        : Icons.expand;
    }
  }

  private performSearch(): void {
    const editorState = this.getEditorState();

    if (!this.state.query.search) {
      this.state.matches = [];
      this.state.currentMatchIndex = -1;
      this.updateInfo();
      this.clearHighlights();
      return;
    }

    this.state.matches = searchInDocument(editorState, this.state.query);
    this.updateInfo();

    if (this.state.matches.length > 0) {
      // Find the nearest match to the current cursor position
      const currentOffset = editorState.positionToOffset(
        editorState.selection.main.head,
      );
      const nearestIndex = findNearestMatch(
        this.state.matches,
        currentOffset,
        "forward",
      );
      this.selectMatchIndex(nearestIndex);
    } else {
      this.state.currentMatchIndex = -1;
    }

    // Update input styling for no results
    if (this.searchInput) {
      this.searchInput.classList.toggle(
        SearchCSS.noResults,
        this.state.query.search.length > 0 && this.state.matches.length === 0,
      );
    }
  }

  private selectMatchIndex(index: number): void {
    if (index < 0 || index >= this.state.matches.length) {
      this.state.currentMatchIndex = -1;
      return;
    }

    this.state.currentMatchIndex = index;
    const match = this.state.matches[index]!;

    // Update editor selection to the match
    const editorState = this.getEditorState();
    const fromPos = editorState.offsetToPosition(match.from);
    const toPos = editorState.offsetToPosition(match.to);

    const tr = editorState.transaction({
      selection: SelectionSet.single(fromPos, toPos),
      scrollIntoView: true,
    });
    this.dispatch(tr);

    this.updateInfo();
  }

  private updateInfo(): void {
    if (!this.infoElement) return;

    const count = this.state.matches.length;
    if (count === 0) {
      this.infoElement.textContent = this.state.query.search
        ? "No results"
        : "";
      this.infoElement.style.color = this.state.query.search
        ? "var(--teppan-error, #ef4444)"
        : "";
    } else {
      const current = this.state.currentMatchIndex + 1;
      this.infoElement.textContent = `${current}/${count}`;
      this.infoElement.style.color = "";
    }
  }

  private clearHighlights(): void {
    this.state.matches = [];
    this.state.currentMatchIndex = -1;
  }

  private injectStyles(): void {
    const styleId = "teppan-search-panel-styles";
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = getSearchPanelStyles();
    document.head.appendChild(style);
  }
}

/**
 * Create search panel CSS styles
 */
export function getSearchPanelStyles(): string {
  return `
    .${SearchCSS.panel} {
      display: none;
      flex-direction: column;
      gap: 6px;
      padding: 6px 8px;
      background: var(--teppan-panel-bg, #f8f9fa);
      border-bottom: 1px solid var(--teppan-border, #e1e4e8);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      position: relative;
      z-index: 100;
    }

    @media (prefers-color-scheme: dark) {
      .${SearchCSS.panel} {
        background: var(--teppan-panel-bg, #1f2428);
        border-bottom-color: var(--teppan-border, #30363d);
      }
    }

    .${SearchCSS.panelOpen} {
      display: flex;
    }

    .${SearchCSS.row} {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .${SearchCSS.inputGroup} {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      background: var(--teppan-input-bg, #fff);
      border: 1px solid var(--teppan-input-border, #d0d7de);
      border-radius: 6px;
      overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .${SearchCSS.inputGroup}:focus-within {
      border-color: var(--teppan-focus, #0969da);
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.15);
    }

    @media (prefers-color-scheme: dark) {
      .${SearchCSS.inputGroup} {
        background: var(--teppan-input-bg, #0d1117);
        border-color: var(--teppan-input-border, #30363d);
      }

      .${SearchCSS.inputGroup}:focus-within {
        border-color: var(--teppan-focus, #58a6ff);
        box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
      }
    }

    .${SearchCSS.input},
    .${SearchCSS.replaceInput} {
      flex: 1;
      min-width: 0;
      padding: 5px 8px;
      border: none;
      background: transparent;
      font-size: 12px;
      font-family: inherit;
      color: var(--teppan-text, #24292f);
      outline: none;
    }

    .${SearchCSS.input}::placeholder,
    .${SearchCSS.replaceInput}::placeholder {
      color: var(--teppan-placeholder, #6e7781);
    }

    @media (prefers-color-scheme: dark) {
      .${SearchCSS.input},
      .${SearchCSS.replaceInput} {
        color: var(--teppan-text, #c9d1d9);
      }

      .${SearchCSS.input}::placeholder,
      .${SearchCSS.replaceInput}::placeholder {
        color: var(--teppan-placeholder, #8b949e);
      }
    }

    .${SearchCSS.input}.${SearchCSS.noResults} {
      color: var(--teppan-error, #cf222e);
      background: var(--teppan-error-bg, rgba(207, 34, 46, 0.1));
    }

    @media (prefers-color-scheme: dark) {
      .${SearchCSS.input}.${SearchCSS.noResults} {
        color: var(--teppan-error, #f85149);
        background: var(--teppan-error-bg, rgba(248, 81, 73, 0.15));
      }
    }

    .${SearchCSS.buttonIcon},
    .${SearchCSS.toggle},
    .${SearchCSS.expandBtn},
    .${SearchCSS.close} {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--teppan-icon, #57606a);
      cursor: pointer;
      transition: background 0.1s, color 0.1s;
      flex-shrink: 0;
    }

    .${SearchCSS.buttonIcon}:hover,
    .${SearchCSS.toggle}:hover,
    .${SearchCSS.expandBtn}:hover,
    .${SearchCSS.close}:hover {
      background: var(--teppan-hover-bg, rgba(0, 0, 0, 0.07));
      color: var(--teppan-icon-hover, #24292f);
    }

    .${SearchCSS.buttonIcon}:active,
    .${SearchCSS.toggle}:active,
    .${SearchCSS.expandBtn}:active,
    .${SearchCSS.close}:active {
      background: var(--teppan-active-bg, rgba(0, 0, 0, 0.12));
    }

    @media (prefers-color-scheme: dark) {
      .${SearchCSS.buttonIcon},
      .${SearchCSS.toggle},
      .${SearchCSS.expandBtn},
      .${SearchCSS.close} {
        color: var(--teppan-icon, #8b949e);
      }

      .${SearchCSS.buttonIcon}:hover,
      .${SearchCSS.toggle}:hover,
      .${SearchCSS.expandBtn}:hover,
      .${SearchCSS.close}:hover {
        background: var(--teppan-hover-bg, rgba(255, 255, 255, 0.1));
        color: var(--teppan-icon-hover, #c9d1d9);
      }

      .${SearchCSS.buttonIcon}:active,
      .${SearchCSS.toggle}:active,
      .${SearchCSS.expandBtn}:active,
      .${SearchCSS.close}:active {
        background: var(--teppan-active-bg, rgba(255, 255, 255, 0.15));
      }
    }

    .${SearchCSS.toggle} {
      width: 22px;
      height: 22px;
      margin: 2px;
      border-radius: 3px;
    }

    .${SearchCSS.toggle}.${SearchCSS.toggleActive} {
      background: var(--teppan-toggle-active-bg, #0969da);
      color: #fff;
    }

    .${SearchCSS.toggle}.${SearchCSS.toggleActive}:hover {
      background: var(--teppan-toggle-active-hover, #0860ca);
      color: #fff;
    }

    @media (prefers-color-scheme: dark) {
      .${SearchCSS.toggle}.${SearchCSS.toggleActive} {
        background: var(--teppan-toggle-active-bg, #58a6ff);
        color: #0d1117;
      }

      .${SearchCSS.toggle}.${SearchCSS.toggleActive}:hover {
        background: var(--teppan-toggle-active-hover, #79b8ff);
        color: #0d1117;
      }
    }

    .${SearchCSS.info} {
      min-width: 50px;
      padding: 0 4px;
      text-align: center;
      font-size: 11px;
      font-weight: 500;
      color: var(--teppan-info, #57606a);
      white-space: nowrap;
    }

    @media (prefers-color-scheme: dark) {
      .${SearchCSS.info} {
        color: var(--teppan-info, #8b949e);
      }
    }

    .${SearchCSS.expandBtn} {
      width: 20px;
      height: 20px;
    }

    .${SearchCSS.match} {
      background: var(--teppan-match-bg, #fff8c5);
      outline: 1px solid var(--teppan-match-border, #d4a72c);
      border-radius: 2px;
    }

    .${SearchCSS.matchCurrent} {
      background: var(--teppan-match-current-bg, #ffd33d);
      outline: 2px solid var(--teppan-match-current-border, #bf8700);
      border-radius: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .${SearchCSS.match} {
        background: var(--teppan-match-bg, rgba(187, 128, 9, 0.4));
        outline-color: var(--teppan-match-border, #bb8009);
      }

      .${SearchCSS.matchCurrent} {
        background: var(--teppan-match-current-bg, rgba(187, 128, 9, 0.6));
        outline-color: var(--teppan-match-current-border, #d29922);
      }
    }
  `;
}
