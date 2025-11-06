/**
 * WebSocket Handler - Manages real-time communication between players
 */

import { Server, Socket } from 'socket.io';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData,
    ErrorResponse
} from '../types/websocket';
import { SessionManager } from '../managers/SessionManager';
import { RoomManager } from '../managers/RoomManager';
import { ChessGameEngine } from '../managers/ChessGameEngine';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class WebSocketHandler {
    private sessionManager: SessionManager;
    private roomManager: RoomManager;
    private gameEngine: ChessGameEngine;

    constructor(
        private io: TypedServer,
        sessionManager: SessionManager,
        roomManager: RoomManager,
        gameEngine: ChessGameEngine
    ) {
        this.sessionManager = sessionManager;
        this.roomManager = roomManager;
        this.gameEngine = gameEngine;
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.io.on('connection', (socket: TypedSocket) => {
            console.log('A user connected:', socket.id);

            // Handle session creation
            socket.on('create-session', (data) => {
                this.handleCreateSession(socket, data);
            });

            // Handle room creation
            socket.on('create-room', (data) => {
                this.handleCreateRoom(socket, data);
            });

            // Handle room joining
            socket.on('join-room', (data) => {
                this.handleJoinRoom(socket, data);
            });

            // Handle chess moves
            socket.on('make-move', (data) => {
                this.handleMakeMove(socket, data);
            });

            // Handle draw offers
            socket.on('offer-draw', (data) => {
                this.handleOfferDraw(socket, data);
            });

            socket.on('accept-draw', (data) => {
                this.handleAcceptDraw(socket, data);
            });

            socket.on('decline-draw', (data) => {
                this.handleDeclineDraw(socket, data);
            });

            // Handle game start
            socket.on('start-game', (data) => {
                this.handleStartGame(socket, data);
            });

            // Handle room status request
            socket.on('get-room-status', (data) => {
                this.handleGetRoomStatus(socket, data);
            });

            // Handle resignation
            socket.on('resign', (data) => {
                this.handleResign(socket, data);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    private handleCreateSession(socket: TypedSocket, data: { nickname: string }): void {
        try {
            // Validate input
            if (data.nickname === null || data.nickname === undefined || typeof data.nickname !== 'string') {
                this.sendError(socket, 'VALIDATION_ERROR', 'Nickname is required');
                return;
            }

            const session = this.sessionManager.createSession({
                nickname: data.nickname,
                socketId: socket.id
            });

            socket.data.sessionId = session.id;

            socket.emit('session-created', {
                success: true,
                session: {
                    id: session.id,
                    nickname: session.nickname
                }
            });

            console.log(`Session created for ${session.nickname} (${session.id})`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
            // Check if it's a validation error from SessionManager
            const errorCode = errorMessage.includes('empty') || errorMessage.includes('characters') ||
                errorMessage.includes('long') || errorMessage.includes('contain') || errorMessage.includes('least') ? 'INVALID_NICKNAME' : 'VALIDATION_ERROR';
            this.sendError(socket, errorCode, errorMessage);
        }
    }

    private handleCreateRoom(socket: TypedSocket, data: { password: string }): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session not found');
                return;
            }

            // Validate input
            if (data.password === null || data.password === undefined || typeof data.password !== 'string') {
                this.sendError(socket, 'VALIDATION_ERROR', 'Password is required');
                return;
            }

            const room = this.roomManager.createRoom({
                password: data.password,
                creatorSessionId: session.id
            });

            // Update session with room info
            this.sessionManager.updateSessionRoom(socket.id, room.id);
            socket.data.roomId = room.id;

            // Join socket to room for broadcasting
            socket.join(room.id);

            socket.emit('room-created', {
                success: true,
                roomId: room.id,
                playerColor: 'white'
            });

            console.log(`Room ${room.id} created by ${session.nickname}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
            // Check if it's a validation error from RoomManager
            const errorCode = errorMessage.includes('empty') || errorMessage.includes('characters') ||
                errorMessage.includes('long') || errorMessage.includes('least') ? 'INVALID_PASSWORD' : 'VALIDATION_ERROR';
            this.sendError(socket, errorCode, errorMessage);
        }
    }

    private handleJoinRoom(socket: TypedSocket, data: { roomId: string; password: string }): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session not found');
                return;
            }

            // Validate input
            if (!data.roomId || !data.password || typeof data.roomId !== 'string' || typeof data.password !== 'string') {
                this.sendError(socket, 'VALIDATION_ERROR', 'Room ID and password are required');
                return;
            }

            const joinResult = this.roomManager.joinRoom({
                roomId: data.roomId,
                password: data.password,
                playerSessionId: session.id
            });

            if (!joinResult.success) {
                const errorCode = joinResult.error === 'Room not found' ? 'ROOM_NOT_FOUND' :
                    joinResult.error === 'Incorrect password' ? 'WRONG_PASSWORD' :
                        joinResult.error === 'Room is full' ? 'ROOM_FULL' : 'VALIDATION_ERROR';
                this.sendError(socket, errorCode, joinResult.error || 'Failed to join room');
                return;
            }

            // Update session with room info
            this.sessionManager.updateSessionRoom(socket.id, data.roomId);
            socket.data.roomId = data.roomId;

            // Join socket to room for broadcasting
            socket.join(data.roomId);

            const room = this.roomManager.getRoomState(data.roomId);
            if (!room) {
                this.sendError(socket, 'ROOM_NOT_FOUND', 'Room not found');
                return;
            }

            // Get opponent info
            const opponentPlayer = room.players.find(p => p.sessionId !== session.id);
            let opponent = null;
            if (opponentPlayer) {
                const opponentSession = this.sessionManager.getSessionById(opponentPlayer.sessionId);
                if (opponentSession) {
                    opponent = { nickname: opponentSession.nickname };
                }
            }

            // Room is now full, but game will be started manually by white player

            socket.emit('room-joined', {
                success: true,
                roomId: data.roomId,
                playerColor: joinResult.playerColor,
                gameState: room.gameState || undefined,
                opponent: opponent || undefined
            });

            // Notify other players in the room
            if (opponent) {
                socket.to(data.roomId).emit('player-joined', {
                    opponent: { nickname: session.nickname },
                    gameState: room.gameState!
                });
            }

            console.log(`${session.nickname} joined room ${data.roomId} as ${joinResult.playerColor}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
            this.sendError(socket, 'VALIDATION_ERROR', errorMessage);
        }
    }

    private handleMakeMove(socket: TypedSocket, data: { move: any }): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session || !session.currentRoom) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session or room not found');
                return;
            }

            // Validate input
            if (!data.move || !data.move.from || !data.move.to) {
                this.sendError(socket, 'VALIDATION_ERROR', 'Invalid move format');
                return;
            }

            const room = this.roomManager.getRoomState(session.currentRoom);
            if (!room || room.status !== 'active') {
                this.sendError(socket, 'GAME_NOT_ACTIVE', 'Game is not active');
                return;
            }

            // Get player color
            const player = room.players.find(p => p.sessionId === session.id);
            if (!player) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Player not found in room');
                return;
            }

            // Check if it's the player's turn
            const gameState = this.gameEngine.getGameState(session.currentRoom);
            if (!gameState || gameState.turn !== player.color) {
                this.sendError(socket, 'NOT_YOUR_TURN', 'It is not your turn');
                return;
            }

            // Attempt to make the move
            const moveSuccess = this.gameEngine.makeMove(session.currentRoom, session.id, {
                from: data.move.from,
                to: data.move.to,
                piece: data.move.piece || '',
                timestamp: Date.now()
            });

            if (!moveSuccess) {
                this.sendError(socket, 'INVALID_MOVE', 'Invalid move');
                return;
            }

            // Get updated game state
            const updatedGameState = this.gameEngine.getGameState(session.currentRoom);
            if (!updatedGameState) {
                this.sendError(socket, 'GAME_NOT_ACTIVE', 'Game state not found');
                return;
            }

            // Update room game state
            room.gameState = updatedGameState;

            // Broadcast move to all players in the room
            this.io.to(session.currentRoom).emit('move-made', {
                move: {
                    from: data.move.from,
                    to: data.move.to,
                    piece: data.move.piece || '',
                    timestamp: Date.now()
                },
                gameState: updatedGameState,
                nextTurn: updatedGameState.turn
            });

            // Check if game is over
            const gameResult = this.gameEngine.isGameOver(session.currentRoom);
            if (gameResult) {
                room.status = 'finished';
                this.io.to(session.currentRoom).emit('game-over', {
                    result: gameResult,
                    gameState: updatedGameState
                });
            }

            console.log(`Move made in room ${session.currentRoom}: ${data.move.from} to ${data.move.to}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to make move';
            this.sendError(socket, 'INVALID_MOVE', errorMessage);
        }
    }

    private handleOfferDraw(socket: TypedSocket, _data: any): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session || !session.currentRoom) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session or room not found');
                return;
            }

            const room = this.roomManager.getRoomState(session.currentRoom);
            if (!room || room.status !== 'active') {
                this.sendError(socket, 'GAME_NOT_ACTIVE', 'Game is not active');
                return;
            }

            const player = room.players.find(p => p.sessionId === session.id);
            if (!player) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Player not found in room');
                return;
            }

            this.gameEngine.offerDraw(session.currentRoom, session.id);

            // Notify opponent about draw offer
            socket.to(session.currentRoom).emit('draw-offered', {
                fromPlayer: {
                    nickname: session.nickname,
                    color: player.color
                }
            });

            console.log(`Draw offered by ${session.nickname} in room ${session.currentRoom}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to offer draw';
            this.sendError(socket, 'VALIDATION_ERROR', errorMessage);
        }
    }

    private handleAcceptDraw(socket: TypedSocket, _data: any): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session || !session.currentRoom) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session or room not found');
                return;
            }

            const room = this.roomManager.getRoomState(session.currentRoom);
            if (!room || room.status !== 'active') {
                this.sendError(socket, 'GAME_NOT_ACTIVE', 'Game is not active');
                return;
            }

            const drawResult = this.gameEngine.acceptDraw(session.currentRoom, session.id);
            if (!drawResult) {
                this.sendError(socket, 'NO_DRAW_OFFER', 'No draw offer to accept');
                return;
            }

            room.status = 'finished';
            const gameState = this.gameEngine.getGameState(session.currentRoom);

            this.io.to(session.currentRoom).emit('draw-accepted', {
                result: drawResult,
                gameState: gameState!
            });

            console.log(`Draw accepted in room ${session.currentRoom}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to accept draw';
            this.sendError(socket, 'VALIDATION_ERROR', errorMessage);
        }
    }

    private handleDeclineDraw(socket: TypedSocket, _data: any): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session || !session.currentRoom) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session or room not found');
                return;
            }

            const room = this.roomManager.getRoomState(session.currentRoom);
            if (!room || room.status !== 'active') {
                this.sendError(socket, 'GAME_NOT_ACTIVE', 'Game is not active');
                return;
            }

            const player = room.players.find(p => p.sessionId === session.id);
            if (!player) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Player not found in room');
                return;
            }

            this.gameEngine.declineDraw(session.currentRoom);

            socket.to(session.currentRoom).emit('draw-declined', {
                byPlayer: {
                    nickname: session.nickname,
                    color: player.color
                }
            });

            console.log(`Draw declined by ${session.nickname} in room ${session.currentRoom}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to decline draw';
            this.sendError(socket, 'VALIDATION_ERROR', errorMessage);
        }
    }

    private handleGetRoomStatus(socket: TypedSocket, _data: any): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session || !session.currentRoom) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session or room not found');
                return;
            }

            const room = this.roomManager.getRoomState(session.currentRoom);
            if (!room) {
                this.sendError(socket, 'ROOM_NOT_FOUND', 'Room not found');
                return;
            }

            const player = room.players.find(p => p.sessionId === session.id);
            if (!player) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Player not found in room');
                return;
            }

            // Get opponent info
            const opponentPlayer = room.players.find(p => p.sessionId !== session.id);
            let opponent = null;
            if (opponentPlayer) {
                const opponentSession = this.sessionManager.getSessionById(opponentPlayer.sessionId);
                if (opponentSession) {
                    opponent = { nickname: opponentSession.nickname };
                }
            }

            socket.emit('room-status', {
                roomId: room.id,
                playerColor: player.color,
                opponent: opponent || undefined,
                gameState: room.gameState || undefined,
                isGameActive: room.status === 'active' && !!room.gameState,
                isRoomReady: room.players.length === 2 && !room.gameState
            });


        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get room status';
            this.sendError(socket, 'VALIDATION_ERROR', errorMessage);
        }
    }

    private handleStartGame(socket: TypedSocket, _data: any): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session || !session.currentRoom) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session or room not found');
                return;
            }

            const room = this.roomManager.getRoomState(session.currentRoom);
            if (!room) {
                this.sendError(socket, 'ROOM_NOT_FOUND', 'Room not found');
                return;
            }

            // Only white player can start the game
            const player = room.players.find(p => p.sessionId === session.id);
            if (!player || player.color !== 'white') {
                this.sendError(socket, 'VALIDATION_ERROR', 'Only white player can start the game');
                return;
            }

            // Check if room has exactly 2 players
            if (room.players.length !== 2) {
                this.sendError(socket, 'VALIDATION_ERROR', 'Room must have exactly 2 players to start');
                return;
            }

            // Check if game is already started
            if (room.gameState) {
                this.sendError(socket, 'VALIDATION_ERROR', 'Game is already started');
                return;
            }

            const whitePlayer = room.players.find(p => p.color === 'white');
            const blackPlayer = room.players.find(p => p.color === 'black');

            if (whitePlayer && blackPlayer) {
                this.gameEngine.initializeGame(session.currentRoom, whitePlayer.sessionId, blackPlayer.sessionId);
                const gameState = this.gameEngine.getGameState(session.currentRoom);

                if (gameState) {
                    room.gameState = gameState;
                    room.status = 'active';

                    // Get both player sessions for proper opponent info
                    const whiteSession = this.sessionManager.getSessionById(whitePlayer.sessionId);
                    const blackSession = this.sessionManager.getSessionById(blackPlayer.sessionId);

                    if (whiteSession && blackSession) {
                        // Notify white player
                        this.io.to(whiteSession.socketId).emit('game-started', {
                            gameState,
                            playerColor: 'white',
                            opponent: { nickname: blackSession.nickname }
                        });

                        // Notify black player
                        this.io.to(blackSession.socketId).emit('game-started', {
                            gameState,
                            playerColor: 'black',
                            opponent: { nickname: whiteSession.nickname }
                        });

                        console.log(`Game started in room ${session.currentRoom} by ${session.nickname}`);
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
            this.sendError(socket, 'VALIDATION_ERROR', errorMessage);
        }
    }

    private handleResign(socket: TypedSocket, _data: any): void {
        try {
            const session = this.getSessionFromSocket(socket);
            if (!session || !session.currentRoom) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Session or room not found');
                return;
            }

            const room = this.roomManager.getRoomState(session.currentRoom);
            if (!room || room.status !== 'active') {
                this.sendError(socket, 'GAME_NOT_ACTIVE', 'Game is not active');
                return;
            }

            const player = room.players.find(p => p.sessionId === session.id);
            if (!player) {
                this.sendError(socket, 'SESSION_NOT_FOUND', 'Player not found in room');
                return;
            }

            const resignResult = this.gameEngine.resign(session.currentRoom, session.id);
            if (!resignResult) {
                this.sendError(socket, 'VALIDATION_ERROR', 'Failed to resign');
                return;
            }

            room.status = 'finished';
            const gameState = this.gameEngine.getGameState(session.currentRoom);

            this.io.to(session.currentRoom).emit('player-resigned', {
                result: resignResult,
                gameState: gameState!,
                resignedPlayer: {
                    nickname: session.nickname,
                    color: player.color
                }
            });

            console.log(`${session.nickname} resigned in room ${session.currentRoom}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to resign';
            this.sendError(socket, 'VALIDATION_ERROR', errorMessage);
        }
    }

    private handleDisconnect(socket: TypedSocket): void {
        const session = this.sessionManager.getSession(socket.id);
        if (session) {
            console.log(`User ${session.nickname} disconnected (${session.id})`);

            // If player was in a room, notify other players
            if (session.currentRoom) {
                const room = this.roomManager.getRoomState(session.currentRoom);
                if (room) {
                    const player = room.players.find(p => p.sessionId === session.id);
                    if (player) {
                        socket.to(session.currentRoom).emit('player-left', {
                            leftPlayer: {
                                nickname: session.nickname,
                                color: player.color
                            }
                        });
                    }
                }

                // Remove player from room
                this.roomManager.leaveRoom(session.id);

                // Clean up game if it exists
                this.gameEngine.cleanupGame(session.currentRoom);
            }

            // Remove session
            this.sessionManager.removeSession(socket.id);
        } else {
            console.log('User disconnected:', socket.id);
        }
    }

    private getSessionFromSocket(socket: TypedSocket) {
        return this.sessionManager.getSession(socket.id);
    }

    private sendError(socket: TypedSocket, code: ErrorResponse['code'], message: string): void {
        socket.emit('error', { code, message });
    }
}