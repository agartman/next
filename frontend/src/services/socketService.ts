/**
 * Socket.io client service with typed events
 */

import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  CreateSessionPayload,
  CreateRoomPayload,
  JoinRoomPayload,
  ChessMove,
} from '../types/websocket';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnecting = false;

  connect(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve(this.socket);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;

      this.socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnecting = false;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', error => {
        console.error('Connection error:', error);
        this.isConnecting = false;
        reject(error);
      });

      this.socket.on('disconnect', reason => {
        console.log('Disconnected from server:', reason);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  // Typed event emitters
  createSession(payload: CreateSessionPayload): void {
    this.socket?.emit('create-session', payload);
  }

  createRoom(payload: CreateRoomPayload): void {
    this.socket?.emit('create-room', payload);
  }

  joinRoom(payload: JoinRoomPayload): void {
    this.socket?.emit('join-room', payload);
  }

  startGame(): void {
    this.socket?.emit('start-game', {});
  }

  getRoomStatus(): void {
    this.socket?.emit('get-room-status', {});
  }

  makeMove(move: ChessMove): void {
    this.socket?.emit('make-move', { move });
  }

  offerDraw(): void {
    this.socket?.emit('offer-draw', {});
  }

  acceptDraw(): void {
    this.socket?.emit('accept-draw', {});
  }

  declineDraw(): void {
    this.socket?.emit('decline-draw', {});
  }

  resign(): void {
    this.socket?.emit('resign', {});
  }

  // Event listener helpers with proper typing
  onSessionCreated(callback: (data: any) => void): void {
    this.socket?.on('session-created', callback);
  }

  onRoomCreated(callback: (data: any) => void): void {
    this.socket?.on('room-created', callback);
  }

  onRoomJoined(callback: (data: any) => void): void {
    this.socket?.on('room-joined', callback);
  }

  onPlayerJoined(callback: (data: any) => void): void {
    this.socket?.on('player-joined', callback);
  }

  onGameStarted(callback: (data: any) => void): void {
    this.socket?.on('game-started', callback);
  }

  onRoomStatus(callback: (data: any) => void): void {
    this.socket?.on('room-status', callback);
  }

  onMoveMade(callback: (data: any) => void): void {
    this.socket?.on('move-made', callback);
  }

  onGameOver(callback: (data: any) => void): void {
    this.socket?.on('game-over', callback);
  }

  onDrawOffered(callback: (data: any) => void): void {
    this.socket?.on('draw-offered', callback);
  }

  onDrawAccepted(callback: (data: any) => void): void {
    this.socket?.on('draw-accepted', callback);
  }

  onDrawDeclined(callback: (data: any) => void): void {
    this.socket?.on('draw-declined', callback);
  }

  onPlayerResigned(callback: (data: any) => void): void {
    this.socket?.on('player-resigned', callback);
  }

  onPlayerLeft(callback: (data: any) => void): void {
    this.socket?.on('player-left', callback);
  }

  onError(callback: (data: any) => void): void {
    this.socket?.on('error', callback);
  }

  // Remove event listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  removeListener(event: keyof ServerToClientEvents, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.removeAllListeners(event);
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
