/**
 * Tests for chess utility functions
 */

import { expect, it, describe } from 'vitest';
import {
  fenToPiece,
  getPieceSymbol,
  parseFenToBoard,
  squareToIndices,
  indicesToSquare,
  isLightSquare,
  getAllSquares,
  type ChessPiece
} from '../chessUtils';

describe('chessUtils', () => {
  describe('fenToPiece', () => {
    it('converts white pieces correctly', () => {
      expect(fenToPiece('K')).toEqual({ type: 'king', color: 'white' });
      expect(fenToPiece('Q')).toEqual({ type: 'queen', color: 'white' });
      expect(fenToPiece('R')).toEqual({ type: 'rook', color: 'white' });
      expect(fenToPiece('B')).toEqual({ type: 'bishop', color: 'white' });
      expect(fenToPiece('N')).toEqual({ type: 'knight', color: 'white' });
      expect(fenToPiece('P')).toEqual({ type: 'pawn', color: 'white' });
    });

    it('converts black pieces correctly', () => {
      expect(fenToPiece('k')).toEqual({ type: 'king', color: 'black' });
      expect(fenToPiece('q')).toEqual({ type: 'queen', color: 'black' });
      expect(fenToPiece('r')).toEqual({ type: 'rook', color: 'black' });
      expect(fenToPiece('b')).toEqual({ type: 'bishop', color: 'black' });
      expect(fenToPiece('n')).toEqual({ type: 'knight', color: 'black' });
      expect(fenToPiece('p')).toEqual({ type: 'pawn', color: 'black' });
    });

    it('returns null for invalid characters', () => {
      expect(fenToPiece('x')).toBeNull();
      expect(fenToPiece('1')).toBeNull();
      expect(fenToPiece('')).toBeNull();
    });
  });

  describe('getPieceSymbol', () => {
    it('returns correct symbols for white pieces', () => {
      expect(getPieceSymbol({ type: 'king', color: 'white' })).toBe('♔');
      expect(getPieceSymbol({ type: 'queen', color: 'white' })).toBe('♕');
      expect(getPieceSymbol({ type: 'rook', color: 'white' })).toBe('♖');
      expect(getPieceSymbol({ type: 'bishop', color: 'white' })).toBe('♗');
      expect(getPieceSymbol({ type: 'knight', color: 'white' })).toBe('♘');
      expect(getPieceSymbol({ type: 'pawn', color: 'white' })).toBe('♙');
    });

    it('returns correct symbols for black pieces', () => {
      expect(getPieceSymbol({ type: 'king', color: 'black' })).toBe('♚');
      expect(getPieceSymbol({ type: 'queen', color: 'black' })).toBe('♛');
      expect(getPieceSymbol({ type: 'rook', color: 'black' })).toBe('♜');
      expect(getPieceSymbol({ type: 'bishop', color: 'black' })).toBe('♝');
      expect(getPieceSymbol({ type: 'knight', color: 'black' })).toBe('♞');
      expect(getPieceSymbol({ type: 'pawn', color: 'black' })).toBe('♟');
    });
  });

  describe('parseFenToBoard', () => {
    it('parses starting position correctly', () => {
      const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const board = parseFenToBoard(startingFen);
      
      // Check board dimensions
      expect(board).toHaveLength(8);
      expect(board[0]).toHaveLength(8);
      
      // Check some key pieces
      expect(board[0][0]).toEqual({ type: 'rook', color: 'black' });
      expect(board[0][4]).toEqual({ type: 'king', color: 'black' });
      expect(board[7][0]).toEqual({ type: 'rook', color: 'white' });
      expect(board[7][4]).toEqual({ type: 'king', color: 'white' });
      
      // Check empty squares
      expect(board[2][0]).toBeNull();
      expect(board[3][3]).toBeNull();
      expect(board[4][4]).toBeNull();
    });

    it('handles empty squares correctly', () => {
      const fenWithGaps = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      const board = parseFenToBoard(fenWithGaps);
      
      // Check that gaps are null
      expect(board[0][1]).toBeNull(); // b8
      expect(board[0][6]).toBeNull(); // g8
    });
  });

  describe('squareToIndices', () => {
    it('converts squares to correct indices', () => {
      expect(squareToIndices('a1')).toEqual([7, 0]);
      expect(squareToIndices('a8')).toEqual([0, 0]);
      expect(squareToIndices('h1')).toEqual([7, 7]);
      expect(squareToIndices('h8')).toEqual([0, 7]);
      expect(squareToIndices('e4')).toEqual([4, 4]);
      expect(squareToIndices('d5')).toEqual([3, 3]);
    });
  });

  describe('indicesToSquare', () => {
    it('converts indices to correct squares', () => {
      expect(indicesToSquare(7, 0)).toBe('a1');
      expect(indicesToSquare(0, 0)).toBe('a8');
      expect(indicesToSquare(7, 7)).toBe('h1');
      expect(indicesToSquare(0, 7)).toBe('h8');
      expect(indicesToSquare(4, 4)).toBe('e4');
      expect(indicesToSquare(3, 3)).toBe('d5');
    });
  });

  describe('isLightSquare', () => {
    it('identifies light squares correctly', () => {
      // Light squares (rank + file is even)
      expect(isLightSquare(0, 0)).toBe(true); // a8
      expect(isLightSquare(0, 2)).toBe(true); // c8
      expect(isLightSquare(1, 1)).toBe(true); // b7
      expect(isLightSquare(7, 7)).toBe(true); // h1
    });

    it('identifies dark squares correctly', () => {
      // Dark squares (rank + file is odd)
      expect(isLightSquare(0, 1)).toBe(false); // b8
      expect(isLightSquare(1, 0)).toBe(false); // a7
      expect(isLightSquare(7, 6)).toBe(false); // g1
      expect(isLightSquare(4, 3)).toBe(false); // d4
    });
  });

  describe('getAllSquares', () => {
    it('returns all 64 squares', () => {
      const squares = getAllSquares();
      expect(squares).toHaveLength(64);
      
      // Check first and last squares
      expect(squares[0]).toBe('a8');
      expect(squares[63]).toBe('h1');
      
      // Check some middle squares
      expect(squares).toContain('e4');
      expect(squares).toContain('d5');
      expect(squares).toContain('a1');
      expect(squares).toContain('h8');
    });

    it('contains all valid square names', () => {
      const squares = getAllSquares();
      
      // Check that all files and ranks are represented
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
      
      files.forEach(file => {
        ranks.forEach(rank => {
          expect(squares).toContain(file + rank);
        });
      });
    });
  });

  describe('round trip conversions', () => {
    it('square to indices to square', () => {
      const testSquares = ['a1', 'e4', 'h8', 'd5', 'b7', 'f2'];
      
      testSquares.forEach(square => {
        const [rank, file] = squareToIndices(square);
        const convertedBack = indicesToSquare(rank, file);
        expect(convertedBack).toBe(square);
      });
    });
  });
});