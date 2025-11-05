/**
 * Custom hook for managing chess board state and interactions
 */

import { useState, useCallback, useMemo } from 'react';
import { ChessGameState, ChessMove } from '../types/websocket';
import { squareToIndices, parseFenToBoard } from '../utils/chessUtils';

interface UseChessBoardProps {
  gameState: ChessGameState | null;
  playerColor: 'white' | 'black' | null;
  onMove?: (move: ChessMove) => void;
}

interface UseChessBoardReturn {
  selectedSquare: string;
  validMoves: string[];
  onSquareSelect: (square: string) => void;
  clearSelection: () => void;
}

export const useChessBoard = ({
  gameState,
  playerColor,
  onMove
}: UseChessBoardProps): UseChessBoardReturn => {
  const [selectedSquare, setSelectedSquare] = useState<string>('');

  // Parse board position for move validation
  const boardPosition = useMemo(() => {
    if (!gameState?.fen) {
      const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      return parseFenToBoard(defaultFen);
    }
    return parseFenToBoard(gameState.fen);
  }, [gameState?.fen]);

  // Calculate valid moves for selected piece
  const validMoves = useMemo(() => {
    if (!selectedSquare || !gameState || !playerColor) return [];
    
    const [rank, file] = squareToIndices(selectedSquare);
    const selectedPiece = boardPosition[rank][file];
    
    if (!selectedPiece || selectedPiece.color !== playerColor) return [];
    
    // Basic move validation - this is a simplified version
    // In a real implementation, you'd use a chess library like chess.js
    const moves: string[] = [];
    
    // For now, return basic moves based on piece type
    // This is a placeholder - real chess move generation is complex
    switch (selectedPiece.type) {
      case 'pawn':
        moves.push(...getPawnMoves(rank, file, selectedPiece.color, boardPosition));
        break;
      case 'rook':
        moves.push(...getRookMoves(rank, file, selectedPiece.color, boardPosition));
        break;
      case 'knight':
        moves.push(...getKnightMoves(rank, file, selectedPiece.color, boardPosition));
        break;
      case 'bishop':
        moves.push(...getBishopMoves(rank, file, selectedPiece.color, boardPosition));
        break;
      case 'queen':
        moves.push(...getQueenMoves(rank, file, selectedPiece.color, boardPosition));
        break;
      case 'king':
        moves.push(...getKingMoves(rank, file, selectedPiece.color, boardPosition));
        break;
    }
    
    return moves.filter(move => isValidSquare(move));
  }, [selectedSquare, gameState, playerColor, boardPosition]);

  const onSquareSelect = useCallback((square: string) => {
    setSelectedSquare(square);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSquare('');
  }, []);

  return {
    selectedSquare,
    validMoves,
    onSquareSelect,
    clearSelection
  };
};

// Helper functions for basic move generation
// Note: These are simplified and don't handle all chess rules

const isValidSquare = (square: string): boolean => {
  return square.length === 2 && 
         square[0] >= 'a' && square[0] <= 'h' &&
         square[1] >= '1' && square[1] <= '8';
};

const indicesToSquare = (rank: number, file: number): string => {
  const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
  const rankChar = (8 - rank).toString();
  return fileChar + rankChar;
};

const isSquareEmpty = (rank: number, file: number, board: any[][]): boolean => {
  return rank >= 0 && rank < 8 && file >= 0 && file < 8 && board[rank][file] === null;
};

const isEnemyPiece = (rank: number, file: number, color: 'white' | 'black', board: any[][]): boolean => {
  if (rank < 0 || rank >= 8 || file < 0 || file >= 8) return false;
  const piece = board[rank][file];
  return piece !== null && piece.color !== color;
};

const getPawnMoves = (rank: number, file: number, color: 'white' | 'black', board: any[][]): string[] => {
  const moves: string[] = [];
  const direction = color === 'white' ? -1 : 1;
  const startRank = color === 'white' ? 6 : 1;
  
  // Forward move
  if (isSquareEmpty(rank + direction, file, board)) {
    moves.push(indicesToSquare(rank + direction, file));
    
    // Double move from starting position
    if (rank === startRank && isSquareEmpty(rank + 2 * direction, file, board)) {
      moves.push(indicesToSquare(rank + 2 * direction, file));
    }
  }
  
  // Captures
  if (isEnemyPiece(rank + direction, file - 1, color, board)) {
    moves.push(indicesToSquare(rank + direction, file - 1));
  }
  if (isEnemyPiece(rank + direction, file + 1, color, board)) {
    moves.push(indicesToSquare(rank + direction, file + 1));
  }
  
  return moves;
};

const getRookMoves = (rank: number, file: number, color: 'white' | 'black', board: any[][]): string[] => {
  const moves: string[] = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dr, df] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRank = rank + dr * i;
      const newFile = file + df * i;
      
      if (newRank < 0 || newRank >= 8 || newFile < 0 || newFile >= 8) break;
      
      if (isSquareEmpty(newRank, newFile, board)) {
        moves.push(indicesToSquare(newRank, newFile));
      } else if (isEnemyPiece(newRank, newFile, color, board)) {
        moves.push(indicesToSquare(newRank, newFile));
        break;
      } else {
        break;
      }
    }
  }
  
  return moves;
};

const getKnightMoves = (rank: number, file: number, color: 'white' | 'black', board: any[][]): string[] => {
  const moves: string[] = [];
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  for (const [dr, df] of knightMoves) {
    const newRank = rank + dr;
    const newFile = file + df;
    
    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
      if (isSquareEmpty(newRank, newFile, board) || isEnemyPiece(newRank, newFile, color, board)) {
        moves.push(indicesToSquare(newRank, newFile));
      }
    }
  }
  
  return moves;
};

const getBishopMoves = (rank: number, file: number, color: 'white' | 'black', board: any[][]): string[] => {
  const moves: string[] = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  for (const [dr, df] of directions) {
    for (let i = 1; i < 8; i++) {
      const newRank = rank + dr * i;
      const newFile = file + df * i;
      
      if (newRank < 0 || newRank >= 8 || newFile < 0 || newFile >= 8) break;
      
      if (isSquareEmpty(newRank, newFile, board)) {
        moves.push(indicesToSquare(newRank, newFile));
      } else if (isEnemyPiece(newRank, newFile, color, board)) {
        moves.push(indicesToSquare(newRank, newFile));
        break;
      } else {
        break;
      }
    }
  }
  
  return moves;
};

const getQueenMoves = (rank: number, file: number, color: 'white' | 'black', board: any[][]): string[] => {
  return [
    ...getRookMoves(rank, file, color, board),
    ...getBishopMoves(rank, file, color, board)
  ];
};

const getKingMoves = (rank: number, file: number, color: 'white' | 'black', board: any[][]): string[] => {
  const moves: string[] = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const [dr, df] of directions) {
    const newRank = rank + dr;
    const newFile = file + df;
    
    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
      if (isSquareEmpty(newRank, newFile, board) || isEnemyPiece(newRank, newFile, color, board)) {
        moves.push(indicesToSquare(newRank, newFile));
      }
    }
  }
  
  return moves;
};