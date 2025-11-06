# Design Document

## Overview

The chess multiplayer website is a real-time web application that enables players to engage in chess matches through password-protected rooms. The system uses a session-based approach where players enter nicknames without account creation, create or join rooms with passwords, and play chess with real-time move synchronization.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │
│   (Browser)     │                  │   (Node.js)     │
│                 │                  │                 │
│ • Chess Board   │                  │ • Room Manager  │
│ • Move Input    │                  │ • Game Logic    │
│ • UI Controls   │                  │ • Session Store │
└─────────────────┘                  └─────────────────┘
```

### Technology Stack

**Frontend:**

- React.js with TypeScript and modern hooks
- Socket.io client for real-time WebSocket communication
- Styled-components for CSS-in-JS styling
- Chess board rendering with SVG or Canvas
- Responsive design for mobile and desktop

**Backend:**

- Node.js with Express.js and TypeScript
- Socket.io for WebSocket management
- Chess.js library for game logic and move validation
- In-memory storage for sessions and rooms (no external databases)

## Components and Interfaces

### 1. Session Manager

**Purpose:** Manages temporary player sessions with nicknames

**Interface:**

```typescript
class SessionManager {
  createSession(nickname: string, socketId: string): PlayerSession;
  getSession(socketId: string): PlayerSession | null;
  removeSession(socketId: string): void;
  validateNickname(nickname: string): boolean;
}
```

**Responsibilities:**

- Create temporary sessions when players enter nicknames
- Associate sessions with WebSocket connections
- Clean up sessions when players disconnect

### 2. Room Manager

**Purpose:** Handles password-protected game rooms

**Interface:**

```typescript
class RoomManager {
  createRoom(password: string, creatorId: string): GameRoom;
  joinRoom(roomId: string, password: string, playerId: string): boolean;
  leaveRoom(roomId: string, playerId: string): void;
  getRoomState(roomId: string): GameRoom | null;
  isRoomFull(roomId: string): boolean;
}
```

**Responsibilities:**

- Create rooms with unique IDs and passwords
- Validate passwords for room access
- Track players in each room
- Manage room lifecycle (creation, joining, cleanup)

### 3. Chess Game Engine

**Purpose:** Manages chess game logic and state

**Interface:**

```typescript
class ChessGameEngine {
  initializeGame(roomId: string, whitePlayerId: string, blackPlayerId: string): void;
  makeMove(roomId: string, playerId: string, move: ChessMove): boolean;
  validateMove(roomId: string, move: ChessMove): boolean;
  getGameState(roomId: string): ChessGameState | null;
  isGameOver(roomId: string): GameResult | null;
  offerDraw(roomId: string, playerId: string): void;
  resign(roomId: string, playerId: string): void;
}
```

**Responsibilities:**

- Initialize chess games with standard starting position
- Validate moves according to chess rules
- Track game state (current position, turn, check/checkmate)
- Handle special game actions (resign, draw offers)

### 4. WebSocket Handler

**Purpose:** Manages real-time communication between players

**Events:**

```typescript
// Client to Server
'join-room' -> { roomId: string, password: string, nickname: string }
'create-room' -> { password: string, nickname: string }
'make-move' -> { roomId: string, move: ChessMove }
'offer-draw' -> { roomId: string }
'resign' -> { roomId: string }

// Server to Client
'room-joined' -> { roomId: string, playerColor: 'white' | 'black', gameState: ChessGameState }
'room-created' -> { roomId: string }
'move-made' -> { move: ChessMove, gameState: ChessGameState, nextTurn: 'white' | 'black' }
'game-over' -> { result: GameResult, reason: string }
'draw-offered' -> { fromPlayer: string }
'error' -> { message: string }
```

### 5. Chess Board UI

**Purpose:** Interactive chess board interface

**Interface:**

```typescript
class ChessBoardUI {
  renderBoard(gameState: ChessGameState): void;
  highlightValidMoves(piece: ChessPiece, position: string): void;
  handlePieceClick(position: string): void;
  handleSquareClick(position: string): void;
  updatePosition(move: ChessMove): void;
  showGameStatus(status: GameStatus): void;
}
```

**Responsibilities:**

- Render 8x8 chess board with pieces
- Handle user interactions (clicks, drag-and-drop)
- Highlight valid moves and check conditions
- Display game status and turn indicators

## Data Models

### TypeScript Interfaces

```typescript
interface PlayerSession {
  id: string;
  nickname: string;
  socketId: string;
  currentRoom: string | null;
  createdAt: number;
}

interface GameRoom {
  id: string;
  password: string;
  players: Array<{
    sessionId: string;
    color: 'white' | 'black';
  }>;
  gameState: ChessGameState;
  createdAt: number;
  status: 'waiting' | 'active' | 'finished';
}

interface ChessGameState {
  fen: string;
  turn: 'white' | 'black';
  moveHistory: ChessMove[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  drawOffered: boolean;
}

interface ChessMove {
  from: string;
  to: string;
  piece: string;
  timestamp: number;
}

interface GameResult {
  winner: 'white' | 'black' | 'draw';
  reason: 'checkmate' | 'resignation' | 'draw' | 'stalemate';
}
```

## Error Handling

### Client-Side Error Handling

- **Connection Errors:** Display reconnection attempts and status
- **Invalid Moves:** Show error messages and maintain current position
- **Room Access Errors:** Clear error messages for wrong passwords
- **Network Issues:** Implement automatic reconnection with exponential backoff

### Server-Side Error Handling

- **Invalid Room Passwords:** Return error without revealing room existence
- **Illegal Chess Moves:** Validate and reject with specific error messages
- **Session Timeouts:** Clean up expired sessions and notify remaining players
- **Room Capacity:** Prevent more than 2 players per room

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: 'INVALID_MOVE' | 'ROOM_FULL' | 'WRONG_PASSWORD' | 'SESSION_NOT_FOUND';
    message: string;
  };
}
```

## Testing Strategy

### Unit Testing

- Chess move validation logic
- Room management functions
- Session handling utilities
- Game state transitions

### Integration Testing

- WebSocket event handling
- End-to-end game flows
- Room creation and joining
- Multi-player game scenarios

### Manual Testing

- Cross-browser compatibility
- Mobile responsiveness
- Real-time synchronization
- Network interruption handling

### Performance Testing

- Concurrent room capacity
- WebSocket connection limits
- Memory usage with multiple games
- Response time for move validation
