/**
 * Individual chess square component
 */

import React from 'react';
import styled from 'styled-components';
import { ChessPiece, getPieceSymbol, isLightSquare, squareToIndices } from '../utils/chessUtils';

interface ChessSquareProps {
  square: string;
  piece: ChessPiece | null;
  isSelected: boolean;
  isValidMove: boolean;
  isCheck: boolean;
  onClick: (square: string) => void;
  disabled: boolean;
}

interface SquareStyledProps {
  $isLight: boolean;
  $isSelected: boolean;
  $isValidMove: boolean;
  $isCheck: boolean;
  $disabled: boolean;
}

const SquareContainer = styled.div<SquareStyledProps>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background-color: ${({ theme, $isLight, $isSelected, $isValidMove, $isCheck }) => {
    if ($isCheck) return theme.colors.chess.check;
    if ($isSelected) return theme.colors.chess.highlight;
    if ($isValidMove) return theme.colors.chess.highlight;
    return $isLight ? theme.colors.chess.lightSquare : theme.colors.chess.darkSquare;
  }};
  transition: background-color 0.2s ease;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  &:hover {
    ${({ $disabled, $isSelected, $isValidMove }) =>
      !$disabled &&
      !$isSelected &&
      !$isValidMove &&
      `
        filter: brightness(1.1);
      `}
  }

  ${({ $isValidMove }) =>
    $isValidMove &&
    `
      &::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.3);
        pointer-events: none;
      }
    `}
`;

const PieceSymbol = styled.span`
  font-size: 2.5rem;
  line-height: 1;
  user-select: none;
  pointer-events: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 2rem;
  }
`;

const CoordinateLabel = styled.span<{ $position: 'file' | 'rank' }>`
  position: absolute;
  font-size: 0.7rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  user-select: none;
  pointer-events: none;

  ${({ $position }) =>
    $position === 'file'
      ? `
    bottom: 2px;
    right: 2px;
  `
      : `
    top: 2px;
    left: 2px;
  `}
`;

export const ChessSquare: React.FC<ChessSquareProps> = ({
  square,
  piece,
  isSelected,
  isValidMove,
  isCheck,
  onClick,
  disabled,
}) => {
  const [rank, file] = squareToIndices(square);
  const isLight = isLightSquare(rank, file);

  // Show coordinates on edge squares
  const showFileLabel = rank === 7; // Bottom row
  const showRankLabel = file === 0; // Left column

  const handleClick = () => {
    if (!disabled) {
      onClick(square);
    }
  };

  return (
    <SquareContainer
      $isLight={isLight}
      $isSelected={isSelected}
      $isValidMove={isValidMove}
      $isCheck={isCheck}
      $disabled={disabled}
      onClick={handleClick}
      data-testid={`chess-square-${square}`}
    >
      {piece && (
        <PieceSymbol data-testid={`piece-${piece.color}-${piece.type}`}>
          {getPieceSymbol(piece)}
        </PieceSymbol>
      )}

      {showFileLabel && <CoordinateLabel $position="file">{square[0]}</CoordinateLabel>}

      {showRankLabel && <CoordinateLabel $position="rank">{square[1]}</CoordinateLabel>}
    </SquareContainer>
  );
};
