/**
 * Interactive chess board component
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { ChessSquare } from './ChessSquare';
import { ChessBoardProps } from '../types/game';
import { ChessMove } from '../types/websocket';
import { parseFenToBoard, indicesToSquare, squareToIndices } from '../utils/chessUtils';

const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const BoardGrid = styled.div<{ $flipped: boolean }>`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 400px;
  height: 400px;
  border: 2px solid ${({ theme }) => theme.colors.text.secondary};
  border-radius: 4px;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transform: ${({ $flipped }) => ($flipped ? 'rotate(180deg)' : 'none')};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 320px;
    height: 320px;
  }
`;

const SquareWrapper = styled.div<{ $flipped: boolean }>`
  transform: ${({ $flipped }) => ($flipped ? 'rotate(180deg)' : 'none')};
`;

const GameInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const TurnIndicator = styled.div<{ $isMyTurn: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: 4px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background-color: ${({ theme, $isMyTurn }) =>
    $isMyTurn ? theme.colors.status.success : theme.colors.status.info};
  color: ${({ theme }) => theme.colors.text.inverse};
`;

const StatusMessage = styled.div<{
  $type: 'check' | 'checkmate' | 'stalemate' | 'draw' | 'normal';
}>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: 4px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background-color: ${({ theme, $type }) => {
    switch ($type) {
      case 'check':
        return theme.colors.status.warning;
      case 'checkmate':
        return theme.colors.status.error;
      case 'stalemate':
      case 'draw':
        return theme.colors.status.info;
      default:
        return 'transparent';
    }
  }};
  color: ${({ theme, $type }) =>
    $type !== 'normal' ? theme.colors.text.inverse : theme.colors.text.primary};
  display: ${({ $type }) => ($type === 'normal' ? 'none' : 'block')};
`;

export const ChessBoard: React.FC<ChessBoardProps> = ({
  gameState,
  playerColor,
  onMove,
  selectedSquare,
  onSquareSelect,
  validMoves,
  disabled,
}) => {
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);

  // Parse the board from FEN
  const boardPosition = useMemo(() => {
    if (!gameState?.fen) {
      // Default starting position FEN
      const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      return parseFenToBoard(defaultFen);
    }
    return parseFenToBoard(gameState.fen);
  }, [gameState?.fen]);

  // Determine if board should be flipped (black player sees board from their perspective)
  const shouldFlipBoard = playerColor === 'black';

  // Check if it's the current player's turn
  const isMyTurn = gameState?.turn === playerColor;

  // Find king position if in check
  const kingInCheckSquare = useMemo(() => {
    if (!gameState?.isCheck || !gameState?.turn) return null;

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = boardPosition[rank][file];
        if (piece?.type === 'king' && piece.color === gameState.turn) {
          return indicesToSquare(rank, file);
        }
      }
    }
    return null;
  }, [gameState?.isCheck, gameState?.turn, boardPosition]);

  // Handle square click
  const handleSquareClick = useCallback(
    (square: string) => {
      if (disabled || !isMyTurn) return;

      const [rank, file] = squareToIndices(square);
      const clickedPiece = boardPosition[rank][file];

      if (selectedSquare) {
        if (selectedSquare === square) {
          // Clicking the same square deselects it
          onSquareSelect('');
          setPendingMove(null);
        } else if (validMoves.includes(square)) {
          // Valid move - execute it
          const move: ChessMove = {
            from: selectedSquare,
            to: square,
            piece: '', // Will be filled by the server
            timestamp: Date.now(),
          };

          setPendingMove({ from: selectedSquare, to: square });
          onMove(move);
          onSquareSelect('');
        } else if (clickedPiece?.color === playerColor) {
          // Clicking on another piece of the same color - select it
          onSquareSelect(square);
          setPendingMove(null);
        } else {
          // Invalid move or empty square - deselect
          onSquareSelect('');
          setPendingMove(null);
        }
      } else {
        // No piece selected - select if it's the player's piece
        if (clickedPiece?.color === playerColor) {
          onSquareSelect(square);
          setPendingMove(null);
        }
      }
    },
    [
      disabled,
      isMyTurn,
      selectedSquare,
      validMoves,
      boardPosition,
      playerColor,
      onMove,
      onSquareSelect,
    ]
  );

  // Clear pending move when game state updates (move was processed)
  useEffect(() => {
    if (pendingMove && gameState) {
      setPendingMove(null);
    }
  }, [gameState, pendingMove]);

  // Get status message
  const getStatusMessage = (): {
    type: 'check' | 'checkmate' | 'stalemate' | 'draw' | 'normal';
    text: string;
  } => {
    if (!gameState) return { type: 'normal', text: '' };

    if (gameState.isCheckmate) {
      const winner = gameState.turn === 'white' ? 'Black' : 'White';
      return { type: 'checkmate', text: `Checkmate! ${winner} wins!` };
    }

    if (gameState.isStalemate) {
      return { type: 'stalemate', text: 'Stalemate! Game is a draw.' };
    }

    if (gameState.drawOffered) {
      return { type: 'draw', text: 'Draw offered' };
    }

    if (gameState.isCheck) {
      const playerInCheck = gameState.turn === 'white' ? 'White' : 'Black';
      return { type: 'check', text: `${playerInCheck} is in check!` };
    }

    return { type: 'normal', text: '' };
  };

  const statusMessage = getStatusMessage();

  // Render squares
  const renderSquares = () => {
    const squares = [];

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = indicesToSquare(rank, file);
        const piece = boardPosition[rank][file];
        const isSelected = selectedSquare === square;
        const isValidMove = validMoves.includes(square);
        const isCheck = kingInCheckSquare === square;

        squares.push(
          <SquareWrapper key={square} $flipped={shouldFlipBoard}>
            <ChessSquare
              square={square}
              piece={piece}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isCheck={isCheck}
              onClick={handleSquareClick}
              disabled={disabled || !isMyTurn}
            />
          </SquareWrapper>
        );
      }
    }

    return squares;
  };

  return (
    <BoardContainer data-testid="chess-board">
      <GameInfo>
        <TurnIndicator $isMyTurn={isMyTurn && !disabled}>
          {disabled ? 'Game not active' : isMyTurn ? 'Your turn' : "Opponent's turn"}
        </TurnIndicator>

        <StatusMessage $type={statusMessage.type}>{statusMessage.text}</StatusMessage>
      </GameInfo>

      <BoardGrid $flipped={shouldFlipBoard} data-testid="chess-board-grid">
        {renderSquares()}
      </BoardGrid>

      {pendingMove && (
        <div data-testid="pending-move">
          Processing move: {pendingMove.from} → {pendingMove.to}
        </div>
      )}
    </BoardContainer>
  );
};
