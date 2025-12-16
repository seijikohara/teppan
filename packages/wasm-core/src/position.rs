use serde::{Deserialize, Serialize};

/// Represents a position in the document (line and column)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Position {
    /// Line number (0-indexed)
    pub line: usize,
    /// Column number (0-indexed)
    pub column: usize,
}

impl Position {
    pub fn new(line: usize, column: usize) -> Self {
        Position { line, column }
    }

    pub fn zero() -> Self {
        Position { line: 0, column: 0 }
    }
}

impl Default for Position {
    fn default() -> Self {
        Position::zero()
    }
}

/// Represents a range in the document
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Range {
    /// Start position (inclusive)
    pub start: Position,
    /// End position (exclusive)
    pub end: Position,
}

impl Range {
    pub fn new(start: Position, end: Position) -> Self {
        Range { start, end }
    }

    pub fn from_positions(start_line: usize, start_column: usize, end_line: usize, end_column: usize) -> Self {
        Range {
            start: Position::new(start_line, start_column),
            end: Position::new(end_line, end_column),
        }
    }

    /// Check if the range is empty (start equals end)
    pub fn is_empty(&self) -> bool {
        self.start == self.end
    }

    /// Check if this range contains a position
    pub fn contains(&self, position: Position) -> bool {
        if position.line < self.start.line || position.line > self.end.line {
            return false;
        }
        if position.line == self.start.line && position.column < self.start.column {
            return false;
        }
        if position.line == self.end.line && position.column >= self.end.column {
            return false;
        }
        true
    }
}
