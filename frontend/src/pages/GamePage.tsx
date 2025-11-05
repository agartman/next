/**
 * Game page component for chess gameplay
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { ChessBoard } from '../components/ChessBoard';
import { useChessBoard } from '../hooks/useChessBoard';
import { ChessGameState, ChessMove } from '../types/websocket';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  min-height: 60vh;
  padding: ${({ theme }) => theme.spacing.md};
`;

const GameTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
`;

const GameControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`;

const ControlButton = styled.button`
  background-color: ${({ theme }) => theme.colors.secondary};
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const PlayerName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ColorIndicator = styled.span<{ $color: 'white' | 'black' | null }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: 4px;
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  background-color: ${({ theme, $color }) => 
    $color === 'white' ? theme.colors.chess.lightSquare : 
    $color === 'black' ? theme.colors.chess.darkSquare : 
    theme.colors.surface
  };
  color: ${({ theme, $color }) => 
    $color === 'black' ? theme.colors.text.inverse : theme.colors.text.primary
  };
`;

export const GamePage: React.FC = () => {
  // Mock game state for demonstration - in real app this would come from WebSocket
  const [gameState] = useState<ChessGameState>({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'white',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    drawOffered: false
  });

  // Mock player color - in real app this would come from room state
  const [playerColor] = useState<'white' | 'black'>('white');
  
  // Mock opponent info
  const opponent = { nickname: 'Opponent' };

  const handleMove = (move: ChessMove) => {
    console.log('Move made:', move);
    // In real app, this would send the move via WebSocket
  };

  const {
    selectedSquare,
    validMoves,
    onSquareSelect,
    clearSelection
  } = useChessBoard({
    gameState,
    playerColor,
    onMove: handleMove
  });

  const handleOfferDraw = () => {
    console.log('Draw offered');
    // In real app, this would send draw offer via WebSocket
  };

  const handleResign = () => {
    console.log('Player resigned');
    // In real app, this would send resignation via WebSocket
  };

  return (
    <GameContainer>
      <GameTitle>Chess Game</GameTitle>
      
      <PlayerInfo>
        <PlayerName>You are playing as:</PlayerName>
        <ColorIndicator $color={playerColor}>
          {playerColor ? playerColor.charAt(0).toUpperCase() + playerColor.slice(1) : 'Spectator'}
        </ColorIndicator>
        {opponent && (
          <PlayerName>vs {opponent.nickname}</PlayerName>
        )}
      </PlayerInfo>

      <ChessBoard
        gameState={gameState}
        playerColor={playerColor}
        onMove={handleMove}
        selectedSquare={selectedSquare}
        onSquareSelect={onSquareSelect}
        validMoves={validMoves}
        disabled={false}
      />

      <GameControls>
        <ControlButton 
          onClick={handleOfferDraw}
          disabled={gameState.isCheckmate || gameState.isStalemate}
        >
          Offer Draw
        </ControlButton>
        <ControlButton 
          onClick={handleResign}
          disabled={gameState.isCheckmate || gameState.isStalemate}
        >
          Resign
        </ControlButton>
      </GameControls>
    </GameContainer>
  );
};