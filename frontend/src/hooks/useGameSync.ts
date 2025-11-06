/**
 * Hook for managing real-time game synchronization via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import {
  ChessGameState,
  ChessMove,
  MoveMadeResponse,
  GameStartedResponse,
  PlayerJoinedResponse,
  GameOverResponse,
  DrawOfferedResponse,
  DrawAcceptedResponse,
  DrawDeclinedResponse,
  PlayerResignedResponse,
  PlayerLeftResponse,
  ErrorResponse,
} from '../types/websocket';

interface GameSyncState {
  gameState: ChessGameState | null;
  playerColor: 'white' | 'black' | null;
  opponent: { nickname: string } | null;
  roomId: string | null;
  isConnected: boolean;
  isGameActive: boolean;
  isRoomReady: boolean; // Both players in room but game not started
  error: string | null;
  drawOffer: { fromPlayer: string; color: 'white' | 'black' } | null;
}

interface UseGameSyncReturn extends GameSyncState {
  startGame: () => void;
  makeMove: (move: ChessMove) => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  declineDraw: () => void;
  resign: () => void;
  clearError: () => void;
  reconnect: () => Promise<void>;
}

export const useGameSync = (
  initialRoomState?: {
    roomId: string;
    playerColor: 'white' | 'black';
    nickname: string;
    sessionId: string;
  } | null
): UseGameSyncReturn => {
  const [state, setState] = useState<GameSyncState>({
    gameState: null,
    playerColor: initialRoomState?.playerColor || null,
    opponent: null,
    roomId: initialRoomState?.roomId || null,
    isConnected: false,
    isGameActive: false,
    isRoomReady: false,
    error: null,
    drawOffer: null,
  });

  const eventListenersSetup = useRef(false);

  // Setup WebSocket event listeners
  const setupEventListeners = useCallback(() => {
    if (eventListenersSetup.current) return;
    eventListenersSetup.current = true;

    // Room status event - this will give us current room state
    socketService.onRoomStatus((data: any) => {
      setState(prev => ({
        ...prev,
        playerColor: data.playerColor,
        opponent: data.opponent || null,
        roomId: data.roomId,
        isRoomReady: data.isRoomReady,
        isGameActive: data.isGameActive,
        gameState: data.gameState || null,
        error: null,
      }));
    });

    // Game started event
    socketService.onGameStarted((data: GameStartedResponse) => {
      setState(prev => ({
        ...prev,
        gameState: data.gameState,
        playerColor: data.playerColor,
        opponent: data.opponent,
        isGameActive: true,
        isRoomReady: false,
        error: null,
      }));
    });

    // Player joined event (when second player joins)
    socketService.onPlayerJoined((data: PlayerJoinedResponse) => {
      setState(prev => ({
        ...prev,
        opponent: data.opponent,
        isRoomReady: true,
        isGameActive: false, // Game is not active until manually started
        error: null,
      }));
    });

    // Move made event
    socketService.onMoveMade((data: MoveMadeResponse) => {
      setState(prev => ({
        ...prev,
        gameState: data.gameState,
        error: null,
      }));
    });

    // Game over event
    socketService.onGameOver((data: GameOverResponse) => {
      setState(prev => ({
        ...prev,
        gameState: data.gameState,
        isGameActive: false,
        drawOffer: null,
        error: null,
      }));
    });

    // Draw offered event
    socketService.onDrawOffered((data: DrawOfferedResponse) => {
      setState(prev => ({
        ...prev,
        drawOffer: {
          fromPlayer: data.fromPlayer.nickname,
          color: data.fromPlayer.color,
        },
        error: null,
      }));
    });

    // Draw accepted event
    socketService.onDrawAccepted((data: DrawAcceptedResponse) => {
      setState(prev => ({
        ...prev,
        gameState: data.gameState,
        isGameActive: false,
        drawOffer: null,
        error: null,
      }));
    });

    // Draw declined event
    socketService.onDrawDeclined((_data: DrawDeclinedResponse) => {
      setState(prev => ({
        ...prev,
        drawOffer: null,
        error: null,
      }));
    });

    // Player resigned event
    socketService.onPlayerResigned((data: PlayerResignedResponse) => {
      setState(prev => ({
        ...prev,
        gameState: data.gameState,
        isGameActive: false,
        drawOffer: null,
        error: null,
      }));
    });

    // Player left event
    socketService.onPlayerLeft((data: PlayerLeftResponse) => {
      setState(prev => ({
        ...prev,
        isGameActive: false,
        error: `${data.leftPlayer.nickname} left the game`,
      }));
    });

    // Error event
    socketService.onError((data: ErrorResponse) => {
      setState(prev => ({
        ...prev,
        error: data.message,
      }));
    });
  }, []);

  // Check connection status and initialize room state
  useEffect(() => {
    const checkConnection = () => {
      const isConnected = socketService.isConnected();
      setState(prev => ({
        ...prev,
        isConnected,
      }));
    };

    // Initial check
    checkConnection();

    // Setup listeners if connected
    if (socketService.isConnected()) {
      setupEventListeners();
    }

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [setupEventListeners]);

  // Initialize room state when we have both player color and opponent
  useEffect(() => {
    if (state.playerColor && state.opponent && !state.isGameActive && !state.isRoomReady) {
      setState(prev => ({
        ...prev,
        isRoomReady: true,
      }));
    }
  }, [state.playerColor, state.opponent, state.isGameActive, state.isRoomReady]);

  // Periodically request room status if we don't have opponent info yet
  useEffect(() => {
    if (state.isConnected && state.playerColor && !state.opponent && !state.isGameActive) {
      const interval = setInterval(() => {
        socketService.getRoomStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [state.isConnected, state.playerColor, state.opponent, state.isGameActive]);

  // Setup event listeners when connection is established
  useEffect(() => {
    if (state.isConnected && !eventListenersSetup.current) {
      setupEventListeners();

      // Request current room status if we have initial room state
      if (initialRoomState) {
        setTimeout(() => {
          socketService.getRoomStatus();
        }, 100); // Small delay to ensure listeners are set up
      }
    }
  }, [state.isConnected, setupEventListeners, initialRoomState]);

  // Game actions
  const startGame = useCallback(() => {
    if (!state.isConnected) {
      setState(prev => ({
        ...prev,
        error: 'Cannot start game: not connected',
      }));
      return;
    }

    if (state.playerColor !== 'white') {
      setState(prev => ({
        ...prev,
        error: 'Only white player can start the game',
      }));
      return;
    }

    if (state.isGameActive) {
      setState(prev => ({
        ...prev,
        error: 'Game is already active',
      }));
      return;
    }

    socketService.startGame();
  }, [state.isConnected, state.playerColor, state.isGameActive]);

  const makeMove = useCallback(
    (move: ChessMove) => {
      if (!state.isConnected || !state.isGameActive) {
        setState(prev => ({
          ...prev,
          error: 'Cannot make move: not connected or game not active',
        }));
        return;
      }

      if (state.gameState?.turn !== state.playerColor) {
        setState(prev => ({
          ...prev,
          error: 'Not your turn',
        }));
        return;
      }

      socketService.makeMove(move);
    },
    [state.isConnected, state.isGameActive, state.gameState?.turn, state.playerColor]
  );

  const offerDraw = useCallback(() => {
    if (!state.isConnected || !state.isGameActive) {
      setState(prev => ({
        ...prev,
        error: 'Cannot offer draw: not connected or game not active',
      }));
      return;
    }

    socketService.offerDraw();
  }, [state.isConnected, state.isGameActive]);

  const acceptDraw = useCallback(() => {
    if (!state.isConnected || !state.drawOffer) {
      setState(prev => ({
        ...prev,
        error: 'Cannot accept draw: no draw offer available',
      }));
      return;
    }

    socketService.acceptDraw();
  }, [state.isConnected, state.drawOffer]);

  const declineDraw = useCallback(() => {
    if (!state.isConnected || !state.drawOffer) {
      setState(prev => ({
        ...prev,
        error: 'Cannot decline draw: no draw offer available',
      }));
      return;
    }

    socketService.declineDraw();
  }, [state.isConnected, state.drawOffer]);

  const resign = useCallback(() => {
    if (!state.isConnected || !state.isGameActive) {
      setState(prev => ({
        ...prev,
        error: 'Cannot resign: not connected or game not active',
      }));
      return;
    }

    socketService.resign();
  }, [state.isConnected, state.isGameActive]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const reconnect = useCallback(async () => {
    try {
      await socketService.connect();
      setupEventListeners();
      setState(prev => ({
        ...prev,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to reconnect to server',
      }));
    }
  }, [setupEventListeners]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (eventListenersSetup.current) {
        socketService.removeAllListeners();
        eventListenersSetup.current = false;
      }
    };
  }, []);

  return {
    ...state,
    startGame,
    makeMove,
    offerDraw,
    acceptDraw,
    declineDraw,
    resign,
    clearError,
    reconnect,
  };
};
