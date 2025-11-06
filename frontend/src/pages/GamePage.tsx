/**
 * Game page component for chess gameplay
 */

import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ChessBoard } from '../components/ChessBoard';
import { useChessBoard } from '../hooks/useChessBoard';
import { useGameSync } from '../hooks/useGameSync';
import { socketService } from '../services/socketService';

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

const ConnectionStatus = styled.div<{ $connected: boolean }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: 4px;
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  background-color: ${({ theme, $connected }) => 
    $connected ? theme.colors.status.success : theme.colors.status.error
  };
  color: ${({ theme }) => theme.colors.text.inverse};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.status.error};
  color: ${({ theme }) => theme.colors.text.inverse};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const DrawOfferDialog = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.status.info};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const DrawOfferButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const ReconnectButton = styled.button`
  background-color: ${({ theme }) => theme.colors.status.warning};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

export const GamePage: React.FC = () => {
  // Use real-time game synchronization
  const {
    gameState,
    playerColor,
    opponent,
    isConnected,
    isGameActive,
    error,
    drawOffer,
    makeMove,
    offerDraw,
    acceptDraw,
    declineDraw,
    resign,
    clearError,
    reconnect
  } = useGameSync();

  // Connect to socket on mount
  useEffect(() => {
    const connectSocket = async () => {
      try {
        await socketService.connect();
      } catch (error) {
        console.error('Failed to connect to server:', error);
      }
    };

    if (!socketService.isConnected()) {
      connectSocket();
    }
  }, []);

  const {
    selectedSquare,
    validMoves,
    onSquareSelect
  } = useChessBoard({
    gameState,
    playerColor,
    onMove: makeMove
  });

  const handleOfferDraw = () => {
    offerDraw();
  };

  const handleResign = () => {
    resign();
  };

  const handleAcceptDraw = () => {
    acceptDraw();
  };

  const handleDeclineDraw = () => {
    declineDraw();
  };

  const handleReconnect = async () => {
    await reconnect();
  };

  const handleClearError = () => {
    clearError();
  };

  return (
    <GameContainer>
      <GameTitle>Chess Game</GameTitle>
      
      {/* Connection Status */}
      <ConnectionStatus $connected={isConnected}>
        {isConnected ? 'Connected' : 'Disconnected'}
        {!isConnected && (
          <ReconnectButton onClick={handleReconnect}>
            Reconnect
          </ReconnectButton>
        )}
      </ConnectionStatus>

      {/* Error Message */}
      {error && (
        <ErrorMessage onClick={handleClearError}>
          {error} (Click to dismiss)
        </ErrorMessage>
      )}

      {/* Draw Offer Dialog */}
      {drawOffer && (
        <DrawOfferDialog>
          <div>{drawOffer.fromPlayer} has offered a draw</div>
          <DrawOfferButtons>
            <ControlButton onClick={handleAcceptDraw}>
              Accept
            </ControlButton>
            <ControlButton onClick={handleDeclineDraw}>
              Decline
            </ControlButton>
          </DrawOfferButtons>
        </DrawOfferDialog>
      )}
      
      <PlayerInfo>
        <PlayerName>You are playing as:</PlayerName>
        <ColorIndicator $color={playerColor}>
          {playerColor ? playerColor.charAt(0).toUpperCase() + playerColor.slice(1) : 'Waiting...'}
        </ColorIndicator>
        {opponent && (
          <PlayerName>vs {opponent.nickname}</PlayerName>
        )}
      </PlayerInfo>

      <ChessBoard
        gameState={gameState}
        playerColor={playerColor}
        onMove={makeMove}
        selectedSquare={selectedSquare}
        onSquareSelect={onSquareSelect}
        validMoves={validMoves}
        disabled={!isConnected || !isGameActive}
      />

      <GameControls>
        <ControlButton 
          onClick={handleOfferDraw}
          disabled={!isGameActive || gameState?.isCheckmate || gameState?.isStalemate || !!drawOffer}
        >
          {drawOffer ? 'Draw Offered' : 'Offer Draw'}
        </ControlButton>
        <ControlButton 
          onClick={handleResign}
          disabled={!isGameActive || gameState?.isCheckmate || gameState?.isStalemate}
        >
          Resign
        </ControlButton>
      </GameControls>
    </GameContainer>
  );
};