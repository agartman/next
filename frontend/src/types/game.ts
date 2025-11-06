/**
 * Frontend-specific game state and UI types
 */

import { ChessGameState, ChessMove, GameResult } from './websocket';

export interface PlayerSession {
  id: string;
  nickname: string;
  isConnected: boolean;
}

export interface GameRoom {
  id: string;
  players: Array<{
    nickname: string;
    color: 'white' | 'black';
  }>;
  gameState: ChessGameState | null;
  status: 'waiting' | 'active' | 'finished';
}

export interface GameUIState {
  selectedSquare: string | null;
  validMoves: string[];
  isMyTurn: boolean;
  playerColor: 'white' | 'black' | null;
  opponent: {
    nickname: string;
  } | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: string | null;
}

export interface RoomUIState {
  currentRoom: GameRoom | null;
  isCreatingRoom: boolean;
  isJoiningRoom: boolean;
  roomError: string | null;
}

export interface AppState {
  session: PlayerSession | null;
  room: RoomUIState;
  game: GameUIState;
  isLoading: boolean;
}

// Component Props Interfaces
export interface ChessBoardProps {
  gameState: ChessGameState | null;
  playerColor: 'white' | 'black' | null;
  onMove: (move: ChessMove) => void;
  selectedSquare: string;
  onSquareSelect: (square: string) => void;
  validMoves: string[];
  disabled: boolean;
}

export interface GameControlsProps {
  canResign: boolean;
  canOfferDraw: boolean;
  drawOffered: boolean;
  onResign: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
}

export interface RoomFormProps {
  onCreateRoom: (password: string) => void;
  onJoinRoom: (roomId: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}

export interface NicknameFormProps {
  onSubmit: (nickname: string) => void;
  isLoading: boolean;
  error: string | null;
}

export interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
}

export interface GameStatusProps {
  gameState: ChessGameState | null;
  playerColor: 'white' | 'black' | null;
  opponent: { nickname: string } | null;
  result: GameResult | null;
}
