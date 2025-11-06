/**
 * Main room interface component that handles the flow between nickname entry and room management
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { NicknameEntry } from './NicknameEntry';
import { RoomCreation } from './RoomCreation';
import { RoomJoining } from './RoomJoining';
import { socketService } from '../services/socketService';
import {
  SessionCreatedResponse,
  RoomCreatedResponse,
  RoomJoinedResponse,
  ErrorResponse,
} from '../types/websocket';

const RoomInterfaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  width: 100%;
  max-width: 500px;
`;

const RoomSelectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 400px;
`;

const WelcomeMessage = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const WelcomeTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.large};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const WelcomeSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const ActionButton = styled.button`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const SecondaryButton = styled(ActionButton)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text.inverse};
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const SuccessMessage = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.status.success};
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.status.success};
  border-radius: 8px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

type ViewState =
  | 'nickname'
  | 'room-selection'
  | 'create-room'
  | 'join-room'
  | 'waiting'
  | 'success';

interface RoomInterfaceState {
  nickname: string;
  sessionId: string;
  roomId: string;
  playerColor: 'white' | 'black' | null;
  isLoading: boolean;
  error: string;
}

export interface RoomInterfaceProps {
  onGameReady: (gameData: {
    roomId: string;
    playerColor: 'white' | 'black';
    nickname: string;
    sessionId: string;
  }) => void;
}

export const RoomInterface: React.FC<RoomInterfaceProps> = ({ onGameReady }) => {
  const [view, setView] = useState<ViewState>('nickname');
  const [state, setState] = useState<RoomInterfaceState>({
    nickname: '',
    sessionId: '',
    roomId: '',
    playerColor: null,
    isLoading: false,
    error: '',
  });

  useEffect(() => {
    // Set up socket event listeners
    const handleSessionCreated = (response: SessionCreatedResponse) => {
      setState(prev => ({ ...prev, isLoading: false }));

      if (response.success && response.session) {
        setState(prev => ({
          ...prev,
          sessionId: response.session!.id,
          error: '',
        }));
        setView('room-selection');
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to create session',
        }));
      }
    };

    const handleRoomCreated = (response: RoomCreatedResponse) => {
      setState(prev => ({ ...prev, isLoading: false }));

      if (response.success && response.roomId && response.playerColor) {
        setState(prev => ({
          ...prev,
          roomId: response.roomId!,
          playerColor: response.playerColor!,
          error: '',
        }));
        setView('waiting');
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to create room',
        }));
      }
    };

    const handleRoomJoined = (response: RoomJoinedResponse) => {
      setState(prev => ({ ...prev, isLoading: false }));

      if (response.success && response.roomId && response.playerColor) {
        setState(prev => ({
          ...prev,
          roomId: response.roomId!,
          playerColor: response.playerColor!,
          error: '',
        }));

        // If there's an opponent, the game can start immediately
        if (response.opponent) {
          setView('success');
          setTimeout(() => {
            onGameReady({
              roomId: response.roomId!,
              playerColor: response.playerColor!,
              nickname: state.nickname,
              sessionId: state.sessionId,
            });
          }, 1500);
        } else {
          setView('waiting');
        }
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to join room',
        }));
      }
    };

    const handlePlayerJoined = () => {
      // When a second player joins, start the game
      setView('success');
      setTimeout(() => {
        onGameReady({
          roomId: state.roomId,
          playerColor: state.playerColor!,
          nickname: state.nickname,
          sessionId: state.sessionId,
        });
      }, 1500);
    };

    const handleError = (response: ErrorResponse) => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: response.message,
      }));
    };

    // Connect to socket and set up listeners
    socketService
      .connect()
      .then(() => {
        socketService.onSessionCreated(handleSessionCreated);
        socketService.onRoomCreated(handleRoomCreated);
        socketService.onRoomJoined(handleRoomJoined);
        socketService.onPlayerJoined(handlePlayerJoined);
        socketService.onError(handleError);
      })
      .catch(() => {
        setState(prev => ({
          ...prev,
          error: 'Failed to connect to server',
        }));
      });

    // Cleanup listeners on unmount
    return () => {
      socketService.removeAllListeners();
    };
  }, [onGameReady, state.roomId, state.playerColor, state.nickname, state.sessionId]);

  const handleNicknameSubmit = (nickname: string) => {
    setState(prev => ({
      ...prev,
      nickname,
      isLoading: true,
      error: '',
    }));
    socketService.createSession({ nickname });
  };

  const handleCreateRoom = (password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: '' }));
    socketService.createRoom({ password });
  };

  const handleJoinRoom = (roomId: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: '' }));
    socketService.joinRoom({ roomId, password });
  };

  const handleBackToRoomSelection = () => {
    setState(prev => ({ ...prev, error: '' }));
    setView('room-selection');
  };

  const renderContent = () => {
    switch (view) {
      case 'nickname':
        return (
          <NicknameEntry
            onSubmit={handleNicknameSubmit}
            isLoading={state.isLoading}
            error={state.error}
          />
        );

      case 'room-selection':
        return (
          <RoomSelectionContainer>
            <WelcomeMessage>
              <WelcomeTitle>Welcome, {state.nickname}!</WelcomeTitle>
              <WelcomeSubtitle>Choose how you'd like to play</WelcomeSubtitle>
            </WelcomeMessage>
            <ActionButton onClick={() => setView('create-room')}>Create New Room</ActionButton>
            <SecondaryButton onClick={() => setView('join-room')}>
              Join Existing Room
            </SecondaryButton>
          </RoomSelectionContainer>
        );

      case 'create-room':
        return (
          <RoomCreation
            onCreateRoom={handleCreateRoom}
            onCancel={handleBackToRoomSelection}
            isLoading={state.isLoading}
            error={state.error}
          />
        );

      case 'join-room':
        return (
          <RoomJoining
            onJoinRoom={handleJoinRoom}
            onCancel={handleBackToRoomSelection}
            isLoading={state.isLoading}
            error={state.error}
          />
        );

      case 'waiting':
        return (
          <LoadingMessage>
            <h3>Room Created: {state.roomId}</h3>
            <p>Waiting for another player to join...</p>
            <p>Share the room ID and password with your friend!</p>
          </LoadingMessage>
        );

      case 'success':
        return (
          <SuccessMessage>
            <h3>Game Starting!</h3>
            <p>Both players are ready. Redirecting to game...</p>
          </SuccessMessage>
        );

      default:
        return null;
    }
  };

  return (
    <RoomInterfaceContainer>
      <Card>{renderContent()}</Card>
    </RoomInterfaceContainer>
  );
};
