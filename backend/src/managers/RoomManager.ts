import {
  GameRoom,
  RoomCreationOptions,
  RoomJoinOptions,
  RoomValidationResult,
  RoomJoinResult,
} from '../types/room';

/**
 * RoomManager handles password-protected game rooms with full type safety
 * Manages room creation, joining, validation, and cleanup
 */
export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  /**
   * Creates a new password-protected game room
   */
  createRoom(options: RoomCreationOptions): GameRoom {
    const validation = this.validatePassword(options.password);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid password');
    }

    // Generate unique room ID
    const roomId = this.generateRoomId();

    const room: GameRoom = {
      id: roomId,
      password: options.password.trim(),
      players: [
        {
          sessionId: options.creatorSessionId,
          color: 'white', // Creator gets white pieces
        },
      ],
      gameState: null, // Game state will be initialized when second player joins
      createdAt: Date.now(),
      status: 'waiting',
    };

    // Store room and player mapping
    this.rooms.set(roomId, room);
    this.playerToRoom.set(options.creatorSessionId, roomId);

    return room;
  }

  /**
   * Attempts to join a room with password verification
   */
  joinRoom(options: RoomJoinOptions): RoomJoinResult {
    const room = this.rooms.get(options.roomId);

    if (!room) {
      return {
        success: false,
        error: 'Room not found',
      };
    }

    // Verify password
    if (room.password !== options.password.trim()) {
      return {
        success: false,
        error: 'Incorrect password',
      };
    }

    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.sessionId === options.playerSessionId);
    if (existingPlayer) {
      return {
        success: true,
        playerColor: existingPlayer.color,
      };
    }

    // Check if room is full
    if (room.players.length >= 2) {
      return {
        success: false,
        error: 'Room is full',
      };
    }

    // Add player to room (second player gets black pieces)
    const playerColor: 'white' | 'black' = 'black';
    room.players.push({
      sessionId: options.playerSessionId,
      color: playerColor,
    });

    // Update room status to active when full
    if (room.players.length === 2) {
      room.status = 'active';
    }

    // Update player mapping
    this.playerToRoom.set(options.playerSessionId, options.roomId);

    return {
      success: true,
      playerColor,
    };
  }

  /**
   * Removes a player from their current room
   */
  leaveRoom(sessionId: string): boolean {
    const roomId = this.playerToRoom.get(sessionId);
    if (!roomId) {
      return false;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // Remove player from room
    room.players = room.players.filter(p => p.sessionId !== sessionId);
    this.playerToRoom.delete(sessionId);

    // Clean up empty room
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    } else {
      // If only one player remains, set status back to waiting
      room.status = 'waiting';
    }

    return true;
  }

  /**
   * Gets the current state of a room
   */
  getRoomState(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Checks if a room is full (has 2 players)
   */
  isRoomFull(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.players.length >= 2 : false;
  }

  /**
   * Gets the room ID for a given player session
   */
  getPlayerRoom(sessionId: string): string | null {
    return this.playerToRoom.get(sessionId) || null;
  }

  /**
   * Gets all active rooms (for debugging/monitoring)
   */
  getActiveRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Gets the total number of active rooms
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Validates password according to requirements
   */
  validatePassword(password: string): RoomValidationResult {
    if (password === null || password === undefined || typeof password !== 'string') {
      return {
        isValid: false,
        error: 'Password is required',
      };
    }

    const trimmedPassword = password.trim();

    if (trimmedPassword.length === 0) {
      return {
        isValid: false,
        error: 'Password cannot be empty',
      };
    }

    if (trimmedPassword.length < 3) {
      return {
        isValid: false,
        error: 'Password must be at least 3 characters long',
      };
    }

    if (trimmedPassword.length > 50) {
      return {
        isValid: false,
        error: 'Password must be 50 characters or less',
      };
    }

    return { isValid: true };
  }

  /**
   * Cleans up expired rooms (rooms older than 24 hours with no activity)
   */
  cleanupExpiredRooms(): number {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    let cleanedCount = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.createdAt > maxAge) {
        // Remove all players from mapping
        room.players.forEach(player => {
          this.playerToRoom.delete(player.sessionId);
        });

        // Remove room
        this.rooms.delete(roomId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Generates a unique room ID
   */
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
