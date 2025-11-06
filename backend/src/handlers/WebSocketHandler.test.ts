/**
 * Unit tests for WebSocket Handler
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { SessionManager } from '../managers/SessionManager';
import { RoomManager } from '../managers/RoomManager';
import { ChessGameEngine } from '../managers/ChessGameEngine';
import { WebSocketHandler } from './WebSocketHandler';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../types/websocket';

describe('WebSocketHandler', () => {
  let httpServer: any;
  let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  let sessionManager: SessionManager;
  let roomManager: RoomManager;
  let gameEngine: ChessGameEngine;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeEach(done => {
    // Create HTTP server and Socket.io server
    httpServer = createServer();
    io = new Server(httpServer);

    // Initialize managers
    sessionManager = new SessionManager();
    roomManager = new RoomManager();
    gameEngine = new ChessGameEngine();

    // Initialize WebSocket handler
    new WebSocketHandler(io, sessionManager, roomManager, gameEngine);

    // Start server
    httpServer.listen(() => {
      serverPort = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    io.close();
    httpServer.close();
  });

  const connectClient = (): Promise<ClientSocket> => {
    return new Promise(resolve => {
      const client = Client(`http://localhost:${serverPort}`);
      client.on('connect', () => {
        resolve(client);
      });
    });
  };

  describe('Session Management', () => {
    test('should create session with valid nickname', async () => {
      clientSocket = await connectClient();

      const sessionPromise = new Promise(resolve => {
        clientSocket.on('session-created', resolve);
      });

      clientSocket.emit('create-session', { nickname: 'TestPlayer' });

      const response: any = await sessionPromise;
      expect(response.success).toBe(true);
      expect(response.session.nickname).toBe('TestPlayer');
      expect(response.session.id).toBeDefined();
    });

    test('should reject session with invalid nickname', async () => {
      clientSocket = await connectClient();

      const sessionPromise = new Promise(resolve => {
        clientSocket.on('error', resolve);
      });

      clientSocket.emit('create-session', { nickname: '' });

      const response: any = await sessionPromise;
      expect(response.code).toBe('INVALID_NICKNAME');
      expect(response.message).toContain('empty');
    });

    test('should reject session with missing nickname', async () => {
      clientSocket = await connectClient();

      const errorPromise = new Promise(resolve => {
        clientSocket.on('error', resolve);
      });

      clientSocket.emit('create-session', { nickname: null as any });

      const response: any = await errorPromise;
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('required');
    });
  });

  describe('Room Management', () => {
    beforeEach(async () => {
      clientSocket = await connectClient();

      // Create session first
      const sessionPromise = new Promise(resolve => {
        clientSocket.on('session-created', resolve);
      });
      clientSocket.emit('create-session', { nickname: 'TestPlayer' });
      await sessionPromise;
    });

    test('should create room with valid password', async () => {
      const roomPromise = new Promise(resolve => {
        clientSocket.on('room-created', resolve);
      });

      clientSocket.emit('create-room', { password: 'testpass' });

      const response: any = await roomPromise;
      expect(response.success).toBe(true);
      expect(response.roomId).toBeDefined();
      expect(response.playerColor).toBe('white');
    });

    test('should reject room creation with invalid password', async () => {
      const errorPromise = new Promise(resolve => {
        clientSocket.on('error', resolve);
      });

      clientSocket.emit('create-room', { password: '' });

      const response: any = await errorPromise;
      expect(response.code).toBe('INVALID_PASSWORD');
    });

    test('should allow joining room with correct password', async () => {
      // First create a room
      const roomPromise = new Promise(resolve => {
        clientSocket.on('room-created', resolve);
      });
      clientSocket.emit('create-room', { password: 'testpass' });
      const roomResponse: any = await roomPromise;

      // Connect second client
      const client2 = await connectClient();

      // Create session for second client
      const session2Promise = new Promise(resolve => {
        client2.on('session-created', resolve);
      });
      client2.emit('create-session', { nickname: 'Player2' });
      await session2Promise;

      // Join room
      const joinPromise = new Promise(resolve => {
        client2.on('room-joined', resolve);
      });
      client2.emit('join-room', {
        roomId: roomResponse.roomId,
        password: 'testpass',
      });

      const joinResponse: any = await joinPromise;
      expect(joinResponse.success).toBe(true);
      expect(joinResponse.playerColor).toBe('black');

      client2.disconnect();
    });

    test('should reject joining room with wrong password', async () => {
      // First create a room
      const roomPromise = new Promise(resolve => {
        clientSocket.on('room-created', resolve);
      });
      clientSocket.emit('create-room', { password: 'testpass' });
      const roomResponse: any = await roomPromise;

      // Connect second client
      const client2 = await connectClient();

      // Create session for second client
      const session2Promise = new Promise(resolve => {
        client2.on('session-created', resolve);
      });
      client2.emit('create-session', { nickname: 'Player2' });
      await session2Promise;

      // Try to join with wrong password
      const errorPromise = new Promise(resolve => {
        client2.on('error', resolve);
      });
      client2.emit('join-room', {
        roomId: roomResponse.roomId,
        password: 'wrongpass',
      });

      const errorResponse: any = await errorPromise;
      expect(errorResponse.code).toBe('WRONG_PASSWORD');

      client2.disconnect();
    });
  });

  describe('Game Flow', () => {
    let client2: ClientSocket;
    let roomId: string;
    let gameStartResponse: any;

    beforeEach(async () => {
      // Setup two clients with sessions and a room
      clientSocket = await connectClient();
      client2 = await connectClient();

      // Create sessions
      const session1Promise = new Promise(resolve => {
        clientSocket.on('session-created', resolve);
      });
      clientSocket.emit('create-session', { nickname: 'Player1' });
      await session1Promise;

      const session2Promise = new Promise(resolve => {
        client2.on('session-created', resolve);
      });
      client2.emit('create-session', { nickname: 'Player2' });
      await session2Promise;

      // Create room
      const roomPromise = new Promise(resolve => {
        clientSocket.on('room-created', resolve);
      });
      clientSocket.emit('create-room', { password: 'testpass' });
      const roomResponse: any = await roomPromise;
      roomId = roomResponse.roomId;

      // Join room
      const joinPromise = new Promise(resolve => {
        client2.on('room-joined', resolve);
      });
      client2.emit('join-room', { roomId, password: 'testpass' });
      await joinPromise;

      // Set up game-started listener
      const gameStartPromise = new Promise(resolve => {
        clientSocket.on('game-started', resolve);
      });

      // Manually start the game (white player starts)
      clientSocket.emit('start-game', {});

      // Wait for game to start
      gameStartResponse = await gameStartPromise;
    });

    afterEach(() => {
      if (client2) {
        client2.disconnect();
      }
    });

    test('should start game when white player clicks start', async () => {
      // Game should already be started from beforeEach
      expect(gameStartResponse.gameState).toBeDefined();
      expect(gameStartResponse.gameState.turn).toBe('white');
      expect(gameStartResponse.opponent.nickname).toBe('Player2');
    });

    test('should reject game start from black player', async () => {
      // Create a separate test setup without auto-starting the game
      const testClient1 = await connectClient();
      const testClient2 = await connectClient();

      // Create sessions
      const session1Promise = new Promise(resolve => {
        testClient1.on('session-created', resolve);
      });
      testClient1.emit('create-session', { nickname: 'TestPlayer1' });
      await session1Promise;

      const session2Promise = new Promise(resolve => {
        testClient2.on('session-created', resolve);
      });
      testClient2.emit('create-session', { nickname: 'TestPlayer2' });
      await session2Promise;

      // Create room
      const roomPromise = new Promise(resolve => {
        testClient1.on('room-created', resolve);
      });
      testClient1.emit('create-room', { password: 'testpass' });
      const roomResponse: any = await roomPromise;

      // Join room
      const joinPromise = new Promise(resolve => {
        testClient2.on('room-joined', resolve);
      });
      testClient2.emit('join-room', { roomId: roomResponse.roomId, password: 'testpass' });
      await joinPromise;

      // Black player tries to start game (should fail)
      const errorPromise = new Promise(resolve => {
        testClient2.on('error', resolve);
      });

      testClient2.emit('start-game', {});

      const errorResponse: any = await errorPromise;
      expect(errorResponse.code).toBe('VALIDATION_ERROR');
      expect(errorResponse.message).toContain('Only white player can start');

      testClient1.disconnect();
      testClient2.disconnect();
    });

    test('should handle valid chess moves', async () => {
      const movePromise = new Promise(resolve => {
        client2.on('move-made', resolve);
      });

      // White player (clientSocket) makes first move
      clientSocket.emit('make-move', {
        move: { from: 'e2', to: 'e4' },
      });

      const moveResponse: any = await movePromise;
      expect(moveResponse.move.from).toBe('e2');
      expect(moveResponse.move.to).toBe('e4');
      expect(moveResponse.nextTurn).toBe('black');
    });

    test('should reject invalid moves', async () => {
      const errorPromise = new Promise(resolve => {
        clientSocket.on('error', resolve);
      });

      // Try invalid move
      clientSocket.emit('make-move', {
        move: { from: 'e2', to: 'e5' }, // Invalid pawn move
      });

      const errorResponse: any = await errorPromise;
      expect(errorResponse.code).toBe('INVALID_MOVE');
    });

    test('should handle draw offers', async () => {
      const drawOfferPromise = new Promise(resolve => {
        client2.on('draw-offered', resolve);
      });

      clientSocket.emit('offer-draw', {});

      const drawOfferResponse: any = await drawOfferPromise;
      expect(drawOfferResponse.fromPlayer.nickname).toBe('Player1');
      expect(drawOfferResponse.fromPlayer.color).toBe('white');
    });

    test('should handle resignation', async () => {
      const resignPromise = new Promise(resolve => {
        client2.on('player-resigned', resolve);
      });

      clientSocket.emit('resign', {});

      const resignResponse: any = await resignPromise;
      expect(resignResponse.result.winner).toBe('black');
      expect(resignResponse.result.reason).toBe('resignation');
      expect(resignResponse.resignedPlayer.nickname).toBe('Player1');
    });
  });

  describe('Error Handling', () => {
    test('should handle requests without session', async () => {
      clientSocket = await connectClient();

      const errorPromise = new Promise(resolve => {
        clientSocket.on('error', resolve);
      });

      clientSocket.emit('create-room', { password: 'testpass' });

      const response: any = await errorPromise;
      expect(response.code).toBe('SESSION_NOT_FOUND');
    });

    test('should handle moves when not in game', async () => {
      clientSocket = await connectClient();

      // Create session but no room
      const sessionPromise = new Promise(resolve => {
        clientSocket.on('session-created', resolve);
      });
      clientSocket.emit('create-session', { nickname: 'TestPlayer' });
      await sessionPromise;

      const errorPromise = new Promise(resolve => {
        clientSocket.on('error', resolve);
      });

      clientSocket.emit('make-move', {
        move: { from: 'e2', to: 'e4' },
      });

      const response: any = await errorPromise;
      expect(response.code).toBe('SESSION_NOT_FOUND');
    });
  });
});
