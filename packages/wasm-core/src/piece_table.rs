use crate::position::Position;

/// Identifies which buffer a piece refers to
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BufferType {
    Original,
    Add,
}

/// A piece represents a contiguous range of text from one of the buffers
#[derive(Debug, Clone)]
pub struct Piece {
    /// Which buffer this piece refers to
    pub buffer: BufferType,
    /// Start offset in the buffer
    pub start: usize,
    /// Length of text in this piece
    pub length: usize,
    /// Cached line start offsets within this piece (relative to piece start)
    pub line_starts: Vec<usize>,
}

impl Piece {
    pub fn new(buffer: BufferType, start: usize, length: usize, text: &str) -> Self {
        let line_starts = Self::compute_line_starts(text);
        Piece {
            buffer,
            start,
            length,
            line_starts,
        }
    }

    fn compute_line_starts(text: &str) -> Vec<usize> {
        let mut line_starts = Vec::new();
        for (i, c) in text.char_indices() {
            if c == '\n' {
                line_starts.push(i + 1);
            }
        }
        line_starts
    }

    /// Number of line breaks in this piece
    pub fn line_count(&self) -> usize {
        self.line_starts.len()
    }
}

/// Piece Table data structure for efficient text editing
#[derive(Debug, Clone)]
pub struct PieceTable {
    /// Original (immutable) buffer containing initial content
    original: String,
    /// Add buffer for all inserted text (append-only)
    add_buffer: String,
    /// List of pieces describing the current document
    pieces: Vec<Piece>,
    /// Cached total length
    total_length: usize,
    /// Cached line count
    line_count: usize,
}

impl PieceTable {
    /// Create a new piece table with initial content
    pub fn new(initial_content: String) -> Self {
        let length = initial_content.len();
        let line_count = initial_content.matches('\n').count() + 1;

        let pieces = if length > 0 {
            vec![Piece::new(BufferType::Original, 0, length, &initial_content)]
        } else {
            Vec::new()
        };

        PieceTable {
            original: initial_content,
            add_buffer: String::new(),
            pieces,
            total_length: length,
            line_count,
        }
    }

    /// Get the full text content
    pub fn get_text(&self) -> String {
        let mut result = String::with_capacity(self.total_length);
        for piece in &self.pieces {
            let buffer = match piece.buffer {
                BufferType::Original => &self.original,
                BufferType::Add => &self.add_buffer,
            };
            result.push_str(&buffer[piece.start..piece.start + piece.length]);
        }
        result
    }

    /// Get the total length of the document
    pub fn get_length(&self) -> usize {
        self.total_length
    }

    /// Get the number of lines in the document
    pub fn get_line_count(&self) -> usize {
        self.line_count
    }

    /// Get text in a specific range
    pub fn get_text_range(&self, offset: usize, length: usize) -> String {
        if length == 0 {
            return String::new();
        }

        let mut result = String::with_capacity(length);
        let mut current_offset = 0;
        let end_offset = offset + length;

        for piece in &self.pieces {
            let piece_end = current_offset + piece.length;

            if piece_end <= offset {
                current_offset = piece_end;
                continue;
            }

            if current_offset >= end_offset {
                break;
            }

            let buffer = match piece.buffer {
                BufferType::Original => &self.original,
                BufferType::Add => &self.add_buffer,
            };

            let start_in_piece = if offset > current_offset {
                offset - current_offset
            } else {
                0
            };

            let end_in_piece = if end_offset < piece_end {
                end_offset - current_offset
            } else {
                piece.length
            };

            let buffer_start = piece.start + start_in_piece;
            let buffer_end = piece.start + end_in_piece;
            result.push_str(&buffer[buffer_start..buffer_end]);

            current_offset = piece_end;
        }

        result
    }

    /// Get a specific line by line number (0-indexed)
    pub fn get_line(&self, line: usize) -> Option<String> {
        if line >= self.line_count {
            return None;
        }

        let start_offset = self.get_line_offset(line)?;
        let end_offset = if line + 1 < self.line_count {
            self.get_line_offset(line + 1).unwrap_or(self.total_length)
        } else {
            self.total_length
        };

        let mut line_text = self.get_text_range(start_offset, end_offset - start_offset);

        // Remove trailing newline if present
        if line_text.ends_with('\n') {
            line_text.pop();
        }

        Some(line_text)
    }

    /// Get the character offset at the start of a line
    pub fn get_line_offset(&self, line: usize) -> Option<usize> {
        if line == 0 {
            return Some(0);
        }

        if line >= self.line_count {
            return None;
        }

        let mut current_line = 0;
        let mut current_offset = 0;

        for piece in &self.pieces {
            for &line_start in &piece.line_starts {
                current_line += 1;
                if current_line == line {
                    return Some(current_offset + line_start);
                }
            }
            current_offset += piece.length;
        }

        None
    }

    /// Insert text at the specified offset
    pub fn insert(&mut self, offset: usize, text: &str) {
        if text.is_empty() {
            return;
        }

        let add_start = self.add_buffer.len();
        self.add_buffer.push_str(text);

        let new_piece = Piece::new(BufferType::Add, add_start, text.len(), text);
        let new_lines = new_piece.line_count();

        if self.pieces.is_empty() {
            self.pieces.push(new_piece);
        } else {
            self.insert_piece_at_offset(offset, new_piece);
        }

        self.total_length += text.len();
        self.line_count += new_lines;
    }

    /// Delete text at the specified offset with the given length
    pub fn delete(&mut self, offset: usize, length: usize) {
        if length == 0 || offset >= self.total_length {
            return;
        }

        let deleted_text = self.get_text_range(offset, length);
        let deleted_lines = deleted_text.matches('\n').count();

        self.delete_range(offset, length);

        self.total_length -= length;
        self.line_count -= deleted_lines;
    }

    /// Convert a character offset to a position (line, column)
    pub fn offset_to_position(&self, offset: usize) -> Position {
        if offset == 0 {
            return Position::zero();
        }

        let clamped_offset = offset.min(self.total_length);
        let mut line = 0;
        let mut last_line_start = 0;
        let mut current_offset = 0;

        for piece in &self.pieces {
            for &line_start in &piece.line_starts {
                let absolute_line_start = current_offset + line_start;
                if absolute_line_start <= clamped_offset {
                    line += 1;
                    last_line_start = absolute_line_start;
                } else {
                    break;
                }
            }
            current_offset += piece.length;
            if current_offset >= clamped_offset {
                break;
            }
        }

        Position::new(line, clamped_offset - last_line_start)
    }

    /// Convert a position (line, column) to a character offset
    pub fn position_to_offset(&self, line: usize, column: usize) -> Option<usize> {
        let line_offset = self.get_line_offset(line)?;
        let line_text = self.get_line(line)?;
        let max_column = line_text.len();
        let clamped_column = column.min(max_column);
        Some(line_offset + clamped_column)
    }

    fn insert_piece_at_offset(&mut self, offset: usize, new_piece: Piece) {
        if offset == 0 {
            self.pieces.insert(0, new_piece);
            return;
        }

        if offset >= self.total_length {
            self.pieces.push(new_piece);
            return;
        }

        let mut current_offset = 0;
        let mut insert_index = self.pieces.len();

        for (i, piece) in self.pieces.iter().enumerate() {
            let piece_end = current_offset + piece.length;

            if offset == current_offset {
                insert_index = i;
                break;
            }

            if offset > current_offset && offset < piece_end {
                // Split the piece
                let split_point = offset - current_offset;
                let left = self.split_piece(piece, 0, split_point);
                let right = self.split_piece(piece, split_point, piece.length - split_point);

                self.pieces.splice(i..=i, vec![left, new_piece, right]);
                return;
            }

            if offset == piece_end {
                insert_index = i + 1;
                break;
            }

            current_offset = piece_end;
        }

        self.pieces.insert(insert_index, new_piece);
    }

    fn delete_range(&mut self, offset: usize, length: usize) {
        let end_offset = offset + length;
        let mut new_pieces = Vec::new();
        let mut current_offset = 0;

        for piece in &self.pieces {
            let piece_start = current_offset;
            let piece_end = current_offset + piece.length;

            if piece_end <= offset || piece_start >= end_offset {
                // Piece is completely outside the delete range
                new_pieces.push(piece.clone());
            } else if piece_start >= offset && piece_end <= end_offset {
                // Piece is completely inside the delete range - skip it
            } else if piece_start < offset && piece_end > end_offset {
                // Delete range is in the middle of this piece - split into two
                let left_len = offset - piece_start;
                let right_start = end_offset - piece_start;
                let right_len = piece_end - end_offset;

                new_pieces.push(self.split_piece(piece, 0, left_len));
                new_pieces.push(self.split_piece(piece, right_start, right_len));
            } else if piece_start < offset {
                // Delete range starts in this piece
                let keep_len = offset - piece_start;
                new_pieces.push(self.split_piece(piece, 0, keep_len));
            } else {
                // Delete range ends in this piece
                let skip_len = end_offset - piece_start;
                let keep_len = piece.length - skip_len;
                new_pieces.push(self.split_piece(piece, skip_len, keep_len));
            }

            current_offset = piece_end;
        }

        self.pieces = new_pieces;
    }

    fn split_piece(&self, piece: &Piece, offset: usize, length: usize) -> Piece {
        let buffer = match piece.buffer {
            BufferType::Original => &self.original,
            BufferType::Add => &self.add_buffer,
        };

        let text = &buffer[piece.start + offset..piece.start + offset + length];
        Piece::new(piece.buffer, piece.start + offset, length, text)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_empty() {
        let pt = PieceTable::new(String::new());
        assert_eq!(pt.get_text(), "");
        assert_eq!(pt.get_length(), 0);
        assert_eq!(pt.get_line_count(), 1);
    }

    #[test]
    fn test_new_with_content() {
        let pt = PieceTable::new("hello".to_string());
        assert_eq!(pt.get_text(), "hello");
        assert_eq!(pt.get_length(), 5);
    }

    #[test]
    fn test_insert_at_beginning() {
        let mut pt = PieceTable::new("world".to_string());
        pt.insert(0, "hello ");
        assert_eq!(pt.get_text(), "hello world");
    }

    #[test]
    fn test_insert_at_end() {
        let mut pt = PieceTable::new("hello".to_string());
        pt.insert(5, " world");
        assert_eq!(pt.get_text(), "hello world");
    }

    #[test]
    fn test_insert_in_middle() {
        let mut pt = PieceTable::new("helo".to_string());
        pt.insert(2, "l");
        assert_eq!(pt.get_text(), "hello");
    }

    #[test]
    fn test_delete() {
        let mut pt = PieceTable::new("hello world".to_string());
        pt.delete(5, 6);
        assert_eq!(pt.get_text(), "hello");
    }

    #[test]
    fn test_delete_from_beginning() {
        let mut pt = PieceTable::new("hello world".to_string());
        pt.delete(0, 6);
        assert_eq!(pt.get_text(), "world");
    }

    #[test]
    fn test_get_line() {
        let pt = PieceTable::new("line1\nline2\nline3".to_string());
        assert_eq!(pt.get_line(0), Some("line1".to_string()));
        assert_eq!(pt.get_line(1), Some("line2".to_string()));
        assert_eq!(pt.get_line(2), Some("line3".to_string()));
        assert_eq!(pt.get_line(3), None);
    }

    #[test]
    fn test_line_count() {
        let pt = PieceTable::new("line1\nline2\nline3".to_string());
        assert_eq!(pt.get_line_count(), 3);
    }

    #[test]
    fn test_offset_to_position() {
        let pt = PieceTable::new("ab\ncd\nef".to_string());
        assert_eq!(pt.offset_to_position(0), Position::new(0, 0));
        assert_eq!(pt.offset_to_position(1), Position::new(0, 1));
        assert_eq!(pt.offset_to_position(3), Position::new(1, 0));
        assert_eq!(pt.offset_to_position(6), Position::new(2, 0));
    }

    #[test]
    fn test_position_to_offset() {
        let pt = PieceTable::new("ab\ncd\nef".to_string());
        assert_eq!(pt.position_to_offset(0, 0), Some(0));
        assert_eq!(pt.position_to_offset(0, 1), Some(1));
        assert_eq!(pt.position_to_offset(1, 0), Some(3));
        assert_eq!(pt.position_to_offset(2, 0), Some(6));
    }
}
