use serde::{Deserialize, Serialize};

/// Type of operation performed on the document
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OperationType {
    Insert,
    Delete,
    Replace,
}

/// Represents a single edit operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Operation {
    /// Type of operation
    pub op_type: OperationType,
    /// Character offset where the operation occurred
    pub offset: usize,
    /// Length of the affected text
    pub length: usize,
    /// The text involved in the operation
    /// - For Insert: the inserted text
    /// - For Delete: the deleted text (for undo)
    /// - For Replace: the new text
    pub text: String,
    /// For Replace operations: the old text that was replaced
    pub old_text: Option<String>,
}

impl Operation {
    pub fn new(op_type: OperationType, offset: usize, length: usize, text: String) -> Self {
        Operation {
            op_type,
            offset,
            length,
            text,
            old_text: None,
        }
    }

    pub fn new_replace(offset: usize, delete_length: usize, old_text: String, new_text: String) -> Self {
        Operation {
            op_type: OperationType::Replace,
            offset,
            length: delete_length,
            text: new_text,
            old_text: Some(old_text),
        }
    }

    /// Create an insert operation
    pub fn insert(offset: usize, text: String) -> Self {
        let length = text.len();
        Operation::new(OperationType::Insert, offset, length, text)
    }

    /// Create a delete operation
    pub fn delete(offset: usize, deleted_text: String) -> Self {
        let length = deleted_text.len();
        Operation::new(OperationType::Delete, offset, length, deleted_text)
    }
}
