mod piece_table;
mod operations;
mod history;
mod position;

use wasm_bindgen::prelude::*;

pub use piece_table::PieceTable;
pub use operations::{Operation, OperationType};
pub use history::History;
pub use position::{Position, Range};

/// Document represents the main text document with editing capabilities
#[wasm_bindgen]
pub struct Document {
    piece_table: PieceTable,
    history: History,
}

#[wasm_bindgen]
impl Document {
    /// Create a new document with optional initial content
    #[wasm_bindgen(constructor)]
    pub fn new(initial_content: Option<String>) -> Document {
        Document {
            piece_table: PieceTable::new(initial_content.unwrap_or_default()),
            history: History::new(),
        }
    }

    /// Get the full text content of the document
    #[wasm_bindgen(js_name = getText)]
    pub fn get_text(&self) -> String {
        self.piece_table.get_text()
    }

    /// Get the total length of the document in characters
    #[wasm_bindgen(js_name = getLength)]
    pub fn get_length(&self) -> usize {
        self.piece_table.get_length()
    }

    /// Get the number of lines in the document
    #[wasm_bindgen(js_name = getLineCount)]
    pub fn get_line_count(&self) -> usize {
        self.piece_table.get_line_count()
    }

    /// Get a specific line by line number (0-indexed)
    #[wasm_bindgen(js_name = getLine)]
    pub fn get_line(&self, line: usize) -> Option<String> {
        self.piece_table.get_line(line)
    }

    /// Get the character offset at the start of a line
    #[wasm_bindgen(js_name = getLineOffset)]
    pub fn get_line_offset(&self, line: usize) -> Option<usize> {
        self.piece_table.get_line_offset(line)
    }

    /// Insert text at the specified offset
    #[wasm_bindgen]
    pub fn insert(&mut self, offset: usize, text: &str) -> bool {
        if offset > self.piece_table.get_length() {
            return false;
        }

        let operation = Operation::new(
            OperationType::Insert,
            offset,
            text.len(),
            text.to_string(),
        );

        self.piece_table.insert(offset, text);
        self.history.push(operation);
        true
    }

    /// Delete text at the specified offset with the given length
    #[wasm_bindgen]
    pub fn delete(&mut self, offset: usize, length: usize) -> bool {
        if offset + length > self.piece_table.get_length() {
            return false;
        }

        let deleted_text = self.piece_table.get_text_range(offset, length);
        let operation = Operation::new(
            OperationType::Delete,
            offset,
            length,
            deleted_text,
        );

        self.piece_table.delete(offset, length);
        self.history.push(operation);
        true
    }

    /// Replace text at the specified range
    #[wasm_bindgen]
    pub fn replace(&mut self, offset: usize, length: usize, text: &str) -> bool {
        if offset + length > self.piece_table.get_length() {
            return false;
        }

        let deleted_text = self.piece_table.get_text_range(offset, length);
        let operation = Operation::new_replace(offset, length, deleted_text, text.to_string());

        self.piece_table.delete(offset, length);
        self.piece_table.insert(offset, text);
        self.history.push(operation);
        true
    }

    /// Undo the last operation
    #[wasm_bindgen]
    pub fn undo(&mut self) -> bool {
        if let Some(operation) = self.history.undo() {
            self.apply_inverse_operation(&operation);
            true
        } else {
            false
        }
    }

    /// Redo the last undone operation
    #[wasm_bindgen]
    pub fn redo(&mut self) -> bool {
        if let Some(operation) = self.history.redo() {
            self.apply_operation(&operation);
            true
        } else {
            false
        }
    }

    /// Check if undo is available
    #[wasm_bindgen(js_name = canUndo)]
    pub fn can_undo(&self) -> bool {
        self.history.can_undo()
    }

    /// Check if redo is available
    #[wasm_bindgen(js_name = canRedo)]
    pub fn can_redo(&self) -> bool {
        self.history.can_redo()
    }

    /// Clear the undo/redo history
    #[wasm_bindgen(js_name = clearHistory)]
    pub fn clear_history(&mut self) {
        self.history.clear();
    }

    /// Get text in a specific range
    #[wasm_bindgen(js_name = getTextRange)]
    pub fn get_text_range(&self, offset: usize, length: usize) -> Option<String> {
        if offset + length > self.piece_table.get_length() {
            return None;
        }
        Some(self.piece_table.get_text_range(offset, length))
    }

    /// Convert a character offset to a position (line, column)
    #[wasm_bindgen(js_name = offsetToPosition)]
    pub fn offset_to_position(&self, offset: usize) -> JsValue {
        let position = self.piece_table.offset_to_position(offset);
        serde_wasm_bindgen::to_value(&position).unwrap_or(JsValue::NULL)
    }

    /// Convert a position (line, column) to a character offset
    #[wasm_bindgen(js_name = positionToOffset)]
    pub fn position_to_offset(&self, line: usize, column: usize) -> Option<usize> {
        self.piece_table.position_to_offset(line, column)
    }

    fn apply_operation(&mut self, operation: &Operation) {
        match operation.op_type {
            OperationType::Insert => {
                self.piece_table.insert(operation.offset, &operation.text);
            }
            OperationType::Delete => {
                self.piece_table.delete(operation.offset, operation.length);
            }
            OperationType::Replace => {
                self.piece_table.delete(operation.offset, operation.old_text.as_ref().map_or(0, |t| t.len()));
                self.piece_table.insert(operation.offset, &operation.text);
            }
        }
    }

    fn apply_inverse_operation(&mut self, operation: &Operation) {
        match operation.op_type {
            OperationType::Insert => {
                self.piece_table.delete(operation.offset, operation.length);
            }
            OperationType::Delete => {
                self.piece_table.insert(operation.offset, &operation.text);
            }
            OperationType::Replace => {
                self.piece_table.delete(operation.offset, operation.text.len());
                if let Some(old_text) = &operation.old_text {
                    self.piece_table.insert(operation.offset, old_text);
                }
            }
        }
    }
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn init() {
    // WASM module initialization
}
