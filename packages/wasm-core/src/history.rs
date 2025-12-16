use crate::operations::Operation;

/// Maximum number of operations to keep in history
const MAX_HISTORY_SIZE: usize = 1000;

/// Manages undo/redo history for document operations
#[derive(Debug, Clone)]
pub struct History {
    /// Stack of operations that can be undone
    undo_stack: Vec<Operation>,
    /// Stack of operations that can be redone
    redo_stack: Vec<Operation>,
}

impl History {
    pub fn new() -> Self {
        History {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
        }
    }

    /// Push a new operation onto the undo stack
    /// This clears the redo stack as the history has diverged
    pub fn push(&mut self, operation: Operation) {
        // Clear redo stack when a new operation is performed
        self.redo_stack.clear();

        // Add to undo stack
        self.undo_stack.push(operation);

        // Limit history size
        if self.undo_stack.len() > MAX_HISTORY_SIZE {
            self.undo_stack.remove(0);
        }
    }

    /// Undo the last operation
    /// Returns the operation that was undone, if any
    pub fn undo(&mut self) -> Option<Operation> {
        if let Some(operation) = self.undo_stack.pop() {
            self.redo_stack.push(operation.clone());
            Some(operation)
        } else {
            None
        }
    }

    /// Redo the last undone operation
    /// Returns the operation that was redone, if any
    pub fn redo(&mut self) -> Option<Operation> {
        if let Some(operation) = self.redo_stack.pop() {
            self.undo_stack.push(operation.clone());
            Some(operation)
        } else {
            None
        }
    }

    /// Check if undo is available
    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }

    /// Check if redo is available
    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }

    /// Get the number of operations in the undo stack
    pub fn undo_count(&self) -> usize {
        self.undo_stack.len()
    }

    /// Get the number of operations in the redo stack
    pub fn redo_count(&self) -> usize {
        self.redo_stack.len()
    }

    /// Clear all history
    pub fn clear(&mut self) {
        self.undo_stack.clear();
        self.redo_stack.clear();
    }
}

impl Default for History {
    fn default() -> Self {
        History::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::operations::OperationType;

    #[test]
    fn test_push_and_undo() {
        let mut history = History::new();

        let op = Operation::new(OperationType::Insert, 0, 5, "hello".to_string());
        history.push(op.clone());

        assert!(history.can_undo());
        assert!(!history.can_redo());

        let undone = history.undo();
        assert!(undone.is_some());
        assert!(!history.can_undo());
        assert!(history.can_redo());
    }

    #[test]
    fn test_redo() {
        let mut history = History::new();

        let op = Operation::new(OperationType::Insert, 0, 5, "hello".to_string());
        history.push(op);
        history.undo();

        let redone = history.redo();
        assert!(redone.is_some());
        assert!(history.can_undo());
        assert!(!history.can_redo());
    }

    #[test]
    fn test_push_clears_redo() {
        let mut history = History::new();

        let op1 = Operation::new(OperationType::Insert, 0, 5, "hello".to_string());
        let op2 = Operation::new(OperationType::Insert, 5, 5, "world".to_string());

        history.push(op1);
        history.undo();
        assert!(history.can_redo());

        history.push(op2);
        assert!(!history.can_redo());
    }
}
