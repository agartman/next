/**
 * TypeScript interfaces for room management
 */

export interface GameRoom {
  id: string;
  password: string;
  players: Array<{
    sessionId: string;
    color: 'white' | 'black';
  }>;
  gameState: ChessGameState | null;
  createdAt: number;
  status: 'waiting' | 'active' | 'finished';
}

export interface ChessGameState {
  fen: string;
  turn: 'white' | 'black';
  moveHistory: ChessMove[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  drawOffered: boolean;
}

export interface ChessMove {
  from: string;
  to: string;
  piece: string;
  timestamp: number;
}

export interface GameResult {
  winner: 'white' | 'black' | 'draw';
  reason: 'checkmate' | 'resignation' | 'draw' | 'stalemate';
}

export interface RoomCreationOptions {
  password: string;
  creatorSessionId: string;
}

export interface RoomJoinOptions {
  roomId: string;
  password: string;
  playerSessionId: string;
}

export interface RoomValidationResult {
  isValid: boolean;
  error?: string;
}

export interface RoomJoinResult {
  success: boolean;
  playerColor?: 'white' | 'black';
  error?: string;
}
