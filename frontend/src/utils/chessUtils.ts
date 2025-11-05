/**
 * Chess utility functions and constants
 */

export interface ChessPiece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
}

export interface SquarePosition {
  file: string; // a-h
  rank: string; // 1-8
}

// Chess piece Unicode symbols
export const PIECE_SYMBOLS: Record<string, string> = {
  'white-king': '♔',
  'white-queen': '♕',
  'white-rook': '♖',
  'white-bishop': '♗',
  'white-knight': '♘',
  'white-pawn': '♙',
  'black-king': '♚',
  'black-queen': '♛',
  'black-rook': '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
  'black-pawn': '♟',
};

// Convert FEN piece notation to piece object
export const fenToPiece = (fenChar: string): ChessPiece | null => {
  const pieceMap: Record<string, ChessPiece> = {
    'K': { type: 'king', color: 'white' },
    'Q': { type: 'queen', color: 'white' },
    'R': { type: 'rook', color: 'white' },
    'B': { type: 'bishop', color: 'white' },
    'N': { type: 'knight', color: 'white' },
    'P': { type: 'pawn', color: 'white' },
    'k': { type: 'king', color: 'black' },
    'q': { type: 'queen', color: 'black' },
    'r': { type: 'rook', color: 'black' },
    'b': { type: 'bishop', color: 'black' },
    'n': { type: 'knight', color: 'black' },
    'p': { type: 'pawn', color: 'black' },
  };
  
  return pieceMap[fenChar] || null;
};

// Get piece symbol for display
export const getPieceSymbol = (piece: ChessPiece): string => {
  const key = `${piece.color}-${piece.type}`;
  return PIECE_SYMBOLS[key] || '';
};

// Parse FEN string to board position
export const parseFenToBoard = (fen: string): (ChessPiece | null)[][] => {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const fenParts = fen.split(' ');
  const position = fenParts[0];
  const ranks = position.split('/');
  
  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        // Empty squares
        fileIndex += parseInt(char);
      } else {
        // Piece
        const piece = fenToPiece(char);
        if (piece && fileIndex < 8) {
          board[rankIndex][fileIndex] = piece;
        }
        fileIndex++;
      }
    }
  });
  
  return board;
};

// Convert square notation (e.g., 'e4') to array indices
export const squareToIndices = (square: string): [number, number] => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
  const rank = 8 - parseInt(square[1]); // 0-7 (flipped for array indexing)
  return [rank, file];
};

// Convert array indices to square notation
export const indicesToSquare = (rank: number, file: number): string => {
  const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
  const rankChar = (8 - rank).toString();
  return fileChar + rankChar;
};

// Check if square is light or dark
export const isLightSquare = (rank: number, file: number): boolean => {
  return (rank + file) % 2 === 0;
};

// Get all squares on the board
export const getAllSquares = (): string[] => {
  const squares: string[] = [];
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      squares.push(indicesToSquare(rank, file));
    }
  }
  return squares;
};