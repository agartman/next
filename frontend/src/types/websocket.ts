/**
 * Shared TypeScript interfaces for WebSocket events (frontend copy)
 */

// Re-export types from backend for frontend use
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

// Client to Server Events
export interface ClientToServerEvents {
  'create-session': (data: CreateSessionPayload) => void;
  'create-room': (data: CreateRoomPayload) => void;
  'join-room': (data: JoinRoomPayload) => void;
  'make-move': (data: MakeMovePayload) => void;
  'offer-draw': (data: OfferDrawPayload) => void;
  'accept-draw': (data: AcceptDrawPayload) => void;
  'decline-draw': (data: DeclineDrawPayload) => void;
  'resign': (data: ResignPayload) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  'session-created': (data: SessionCreatedResponse) => void;
  'room-created': (data: RoomCreatedResponse) => void;
  'room-joined': (data: RoomJoinedResponse) => void;
  'player-joined': (data: PlayerJoinedResponse) => void;
  'game-started': (data: GameStartedResponse) => void;
  'move-made': (data: MoveMadeResponse) => void;
  'game-over': (data: GameOverResponse) => void;
  'draw-offered': (data: DrawOfferedResponse) => void;
  'draw-accepted': (data: DrawAcceptedResponse) => void;
  'draw-declined': (data: DrawDeclinedResponse) => void;
  'player-resigned': (data: PlayerResignedResponse) => void;
  'player-left': (data: PlayerLeftResponse) => void;
  'error': (data: ErrorResponse) => void;
}

// Event Payload Interfaces

// Client to Server Payloads
export interface CreateSessionPayload {
  nickname: string;
}

export interface CreateRoomPayload {
  password: string;
}

export interface JoinRoomPayload {
  roomId: string;
  password: string;
}

export interface MakeMovePayload {
  move: ChessMove;
}

export interface OfferDrawPayload {
  // No additional data needed - room and player inferred from session
}

export interface AcceptDrawPayload {
  // No additional data needed - room and player inferred from session
}

export interface DeclineDrawPayload {
  // No additional data needed - room and player inferred from session
}

export interface ResignPayload {
  // No additional data needed - room and player inferred from session
}

// Server to Client Response Interfaces
export interface SessionCreatedResponse {
  success: boolean;
  session?: {
    id: string;
    nickname: string;
  };
  error?: string;
}

export interface RoomCreatedResponse {
  success: boolean;
  roomId?: string;
  playerColor?: 'white' | 'black';
  error?: string;
}

export interface RoomJoinedResponse {
  success: boolean;
  roomId?: string;
  playerColor?: 'white' | 'black';
  gameState?: ChessGameState;
  opponent?: {
    nickname: string;
  };
  error?: string;
}

export interface PlayerJoinedResponse {
  opponent: {
    nickname: string;
  };
  gameState: ChessGameState;
}

export interface GameStartedResponse {
  gameState: ChessGameState;
  playerColor: 'white' | 'black';
  opponent: {
    nickname: string;
  };
}

export interface MoveMadeResponse {
  move: ChessMove;
  gameState: ChessGameState;
  nextTurn: 'white' | 'black';
}

export interface GameOverResponse {
  result: GameResult;
  gameState: ChessGameState;
}

export interface DrawOfferedResponse {
  fromPlayer: {
    nickname: string;
    color: 'white' | 'black';
  };
}

export interface DrawAcceptedResponse {
  result: GameResult;
  gameState: ChessGameState;
}

export interface DrawDeclinedResponse {
  byPlayer: {
    nickname: string;
    color: 'white' | 'black';
  };
}

export interface PlayerResignedResponse {
  result: GameResult;
  gameState: ChessGameState;
  resignedPlayer: {
    nickname: string;
    color: 'white' | 'black';
  };
}

export interface PlayerLeftResponse {
  leftPlayer: {
    nickname: string;
    color: 'white' | 'black';
  };
}

export interface ErrorResponse {
  code: 'INVALID_MOVE' | 'ROOM_FULL' | 'WRONG_PASSWORD' | 'SESSION_NOT_FOUND' | 
        'ROOM_NOT_FOUND' | 'NOT_YOUR_TURN' | 'GAME_NOT_ACTIVE' | 'INVALID_NICKNAME' |
        'INVALID_PASSWORD' | 'ALREADY_IN_ROOM' | 'NO_DRAW_OFFER' | 'VALIDATION_ERROR';
  message: string;
}