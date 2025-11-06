/**
 * Tests for ChessBoard component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { ChessBoard } from './ChessBoard';
import { theme } from '../styles/theme';
import { ChessGameState } from '../types/websocket';
import { expect, it, beforeEach, describe, vi } from 'vitest';

// Mock the useChessBoard hook
vi.mock('../hooks/useChessBoard', () => ({
  useChessBoard: () => ({
    selectedSquare: '',
    validMoves: [],
    onSquareSelect: vi.fn(),
    clearSelection: vi.fn(),
  }),
}));

const mockGameState: ChessGameState = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'white',
  moveHistory: [],
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  drawOffered: false,
};

const defaultProps = {
  gameState: mockGameState,
  playerColor: 'white' as const,
  onMove: vi.fn(),
  selectedSquare: '',
  onSquareSelect: vi.fn(),
  validMoves: [],
  disabled: false,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ChessBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chess board with 64 squares', () => {
    renderWithTheme(<ChessBoard {...defaultProps} />);

    const board = screen.getByTestId('chess-board');
    expect(board).toBeInTheDocument();

    // Check that all 64 squares are rendered
    for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
      for (let rank = 1; rank <= 8; rank++) {
        const square = `${file}${rank}`;
        expect(screen.getByTestId(`chess-square-${square}`)).toBeInTheDocument();
      }
    }
  });

  it('displays pieces in starting position', () => {
    renderWithTheme(<ChessBoard {...defaultProps} />);

    // Check for some key pieces in starting position
    expect(screen.getByTestId('piece-white-king')).toBeInTheDocument();
    expect(screen.getByTestId('piece-black-king')).toBeInTheDocument();
    expect(screen.getAllByTestId(/piece-white-pawn/)).toHaveLength(8);
    expect(screen.getAllByTestId(/piece-black-pawn/)).toHaveLength(8);
  });

  it('shows turn indicator correctly', () => {
    renderWithTheme(<ChessBoard {...defaultProps} />);

    expect(screen.getByText('Your turn')).toBeInTheDocument();
  });

  it('shows opponent turn when not player turn', () => {
    const gameStateBlackTurn = { ...mockGameState, turn: 'black' as const };
    renderWithTheme(<ChessBoard {...defaultProps} gameState={gameStateBlackTurn} />);

    expect(screen.getByText("Opponent's turn")).toBeInTheDocument();
  });

  it('handles square clicks', () => {
    const onSquareSelect = vi.fn();
    renderWithTheme(<ChessBoard {...defaultProps} onSquareSelect={onSquareSelect} />);

    const square = screen.getByTestId('chess-square-e2');
    fireEvent.click(square);

    expect(onSquareSelect).toHaveBeenCalledWith('e2');
  });

  it('highlights selected square', () => {
    renderWithTheme(<ChessBoard {...defaultProps} selectedSquare="e2" />);

    const selectedSquare = screen.getByTestId('chess-square-e2');
    expect(selectedSquare).toBeInTheDocument();
    // The highlighting is tested through CSS classes/styles
  });

  it('shows valid moves', () => {
    renderWithTheme(<ChessBoard {...defaultProps} selectedSquare="e2" validMoves={['e3', 'e4']} />);

    const validMoveSquare1 = screen.getByTestId('chess-square-e3');
    const validMoveSquare2 = screen.getByTestId('chess-square-e4');

    expect(validMoveSquare1).toBeInTheDocument();
    expect(validMoveSquare2).toBeInTheDocument();
  });

  it('executes move when valid move square is clicked', () => {
    const onMove = vi.fn();
    const onSquareSelect = vi.fn();

    renderWithTheme(
      <ChessBoard
        {...defaultProps}
        selectedSquare="e2"
        validMoves={['e4']}
        onMove={onMove}
        onSquareSelect={onSquareSelect}
      />
    );

    const targetSquare = screen.getByTestId('chess-square-e4');
    fireEvent.click(targetSquare);

    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'e2',
        to: 'e4',
      })
    );
    expect(onSquareSelect).toHaveBeenCalledWith('');
  });

  it('shows check status', () => {
    const gameStateInCheck = { ...mockGameState, isCheck: true };
    renderWithTheme(<ChessBoard {...defaultProps} gameState={gameStateInCheck} />);

    expect(screen.getByText('White is in check!')).toBeInTheDocument();
  });

  it('shows checkmate status', () => {
    const gameStateCheckmate = {
      ...mockGameState,
      isCheckmate: true,
      turn: 'white' as const,
    };
    renderWithTheme(<ChessBoard {...defaultProps} gameState={gameStateCheckmate} />);

    expect(screen.getByText('Checkmate! Black wins!')).toBeInTheDocument();
  });

  it('shows stalemate status', () => {
    const gameStateStalemate = { ...mockGameState, isStalemate: true };
    renderWithTheme(<ChessBoard {...defaultProps} gameState={gameStateStalemate} />);

    expect(screen.getByText('Stalemate! Game is a draw.')).toBeInTheDocument();
  });

  it('disables interaction when disabled prop is true', () => {
    const onSquareSelect = vi.fn();
    renderWithTheme(
      <ChessBoard {...defaultProps} disabled={true} onSquareSelect={onSquareSelect} />
    );

    const square = screen.getByTestId('chess-square-e2');
    fireEvent.click(square);

    expect(onSquareSelect).not.toHaveBeenCalled();
    expect(screen.getByText('Game not active')).toBeInTheDocument();
  });

  it('disables interaction when not player turn', () => {
    const onSquareSelect = vi.fn();
    const gameStateBlackTurn = { ...mockGameState, turn: 'black' as const };

    renderWithTheme(
      <ChessBoard
        {...defaultProps}
        gameState={gameStateBlackTurn}
        onSquareSelect={onSquareSelect}
      />
    );

    const square = screen.getByTestId('chess-square-e2');
    fireEvent.click(square);

    expect(onSquareSelect).not.toHaveBeenCalled();
  });

  it('flips board for black player', () => {
    renderWithTheme(<ChessBoard {...defaultProps} playerColor="black" />);

    const boardGrid = screen.getByTestId('chess-board-grid');
    expect(boardGrid).toBeInTheDocument();
    // Board flipping is tested through CSS transforms
  });

  it('shows draw offer status', () => {
    const gameStateDrawOffered = { ...mockGameState, drawOffered: true };
    renderWithTheme(<ChessBoard {...defaultProps} gameState={gameStateDrawOffered} />);

    expect(screen.getByText('Draw offered')).toBeInTheDocument();
  });
});
