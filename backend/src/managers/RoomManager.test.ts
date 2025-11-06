import { RoomManager } from './RoomManager';
import { RoomCreationOptions, RoomJoinOptions } from '../types/room';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    it('should create a valid room with proper password', () => {
      const options: RoomCreationOptions = {
        password: 'testpass123',
        creatorSessionId: 'session123',
      };

      const room = roomManager.createRoom(options);

      expect(room).toBeDefined();
      expect(room.password).toBe('testpass123');
      expect(room.players).toHaveLength(1);
      expect(room.players[0].sessionId).toBe('session123');
      expect(room.players[0].color).toBe('white');
      expect(room.gameState).toBeNull();
      expect(room.status).toBe('waiting');
      expect(room.id).toMatch(/^room_\d+_[a-z0-9]+$/);
      expect(typeof room.createdAt).toBe('number');
      expect(room.createdAt).toBeLessThanOrEqual(Date.now());
    });

    it('should trim whitespace from password', () => {
      const options: RoomCreationOptions = {
        password: '  testpass123  ',
        creatorSessionId: 'session123',
      };

      const room = roomManager.createRoom(options);
      expect(room.password).toBe('testpass123');
    });

    it('should throw error for invalid password', () => {
      const options: RoomCreationOptions = {
        password: '',
        creatorSessionId: 'session123',
      };

      expect(() => roomManager.createRoom(options)).toThrow('Password cannot be empty');
    });

    it('should generate unique room IDs', () => {
      const room1 = roomManager.createRoom({
        password: 'pass1',
        creatorSessionId: 'session1',
      });

      const room2 = roomManager.createRoom({
        password: 'pass2',
        creatorSessionId: 'session2',
      });

      expect(room1.id).not.toBe(room2.id);
    });
  });

  describe('joinRoom', () => {
    let roomId: string;

    beforeEach(() => {
      const room = roomManager.createRoom({
        password: 'testpass',
        creatorSessionId: 'creator123',
      });
      roomId = room.id;
    });

    it('should allow joining with correct password', () => {
      const options: RoomJoinOptions = {
        roomId,
        password: 'testpass',
        playerSessionId: 'player456',
      };

      const result = roomManager.joinRoom(options);

      expect(result.success).toBe(true);
      expect(result.playerColor).toBe('black');
      expect(result.error).toBeUndefined();

      const room = roomManager.getRoomState(roomId);
      expect(room?.players).toHaveLength(2);
      expect(room?.status).toBe('active');
    });

    it('should reject joining with incorrect password', () => {
      const options: RoomJoinOptions = {
        roomId,
        password: 'wrongpass',
        playerSessionId: 'player456',
      };

      const result = roomManager.joinRoom(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Incorrect password');
      expect(result.playerColor).toBeUndefined();
    });

    it('should reject joining non-existent room', () => {
      const options: RoomJoinOptions = {
        roomId: 'nonexistent',
        password: 'testpass',
        playerSessionId: 'player456',
      };

      const result = roomManager.joinRoom(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room not found');
    });

    it('should reject joining when room is full', () => {
      // First player joins
      roomManager.joinRoom({
        roomId,
        password: 'testpass',
        playerSessionId: 'player456',
      });

      // Second player tries to join
      const options: RoomJoinOptions = {
        roomId,
        password: 'testpass',
        playerSessionId: 'player789',
      };

      const result = roomManager.joinRoom(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room is full');
    });

    it('should return existing color if player already in room', () => {
      // Player joins first time
      roomManager.joinRoom({
        roomId,
        password: 'testpass',
        playerSessionId: 'player456',
      });

      // Same player tries to join again
      const result = roomManager.joinRoom({
        roomId,
        password: 'testpass',
        playerSessionId: 'player456',
      });

      expect(result.success).toBe(true);
      expect(result.playerColor).toBe('black');

      const room = roomManager.getRoomState(roomId);
      expect(room?.players).toHaveLength(2); // Should not duplicate
    });

    it('should trim whitespace from password when joining', () => {
      const options: RoomJoinOptions = {
        roomId,
        password: '  testpass  ',
        playerSessionId: 'player456',
      };

      const result = roomManager.joinRoom(options);
      expect(result.success).toBe(true);
    });
  });

  describe('leaveRoom', () => {
    let roomId: string;

    beforeEach(() => {
      const room = roomManager.createRoom({
        password: 'testpass',
        creatorSessionId: 'creator123',
      });
      roomId = room.id;

      roomManager.joinRoom({
        roomId,
        password: 'testpass',
        playerSessionId: 'player456',
      });
    });

    it('should remove player from room', () => {
      const result = roomManager.leaveRoom('player456');

      expect(result).toBe(true);
      const room = roomManager.getRoomState(roomId);
      expect(room?.players).toHaveLength(1);
      expect(room?.players[0].sessionId).toBe('creator123');
      expect(room?.status).toBe('waiting');
    });

    it('should delete room when last player leaves', () => {
      roomManager.leaveRoom('player456');
      roomManager.leaveRoom('creator123');

      const room = roomManager.getRoomState(roomId);
      expect(room).toBeNull();
    });

    it('should return false for player not in any room', () => {
      const result = roomManager.leaveRoom('nonexistent');
      expect(result).toBe(false);
    });

    it('should handle leaving when room no longer exists', () => {
      // Manually delete room to simulate edge case
      const room = roomManager.getRoomState(roomId);
      if (room) {
        roomManager.leaveRoom('creator123');
        roomManager.leaveRoom('player456');
      }

      const result = roomManager.leaveRoom('player456');
      expect(result).toBe(false);
    });
  });

  describe('getRoomState', () => {
    it('should return room state for existing room', () => {
      const createdRoom = roomManager.createRoom({
        password: 'testpass',
        creatorSessionId: 'creator123',
      });

      const roomState = roomManager.getRoomState(createdRoom.id);
      expect(roomState).toEqual(createdRoom);
    });

    it('should return null for non-existent room', () => {
      const roomState = roomManager.getRoomState('nonexistent');
      expect(roomState).toBeNull();
    });
  });

  describe('isRoomFull', () => {
    let roomId: string;

    beforeEach(() => {
      const room = roomManager.createRoom({
        password: 'testpass',
        creatorSessionId: 'creator123',
      });
      roomId = room.id;
    });

    it('should return false for room with one player', () => {
      expect(roomManager.isRoomFull(roomId)).toBe(false);
    });

    it('should return true for room with two players', () => {
      roomManager.joinRoom({
        roomId,
        password: 'testpass',
        playerSessionId: 'player456',
      });

      expect(roomManager.isRoomFull(roomId)).toBe(true);
    });

    it('should return false for non-existent room', () => {
      expect(roomManager.isRoomFull('nonexistent')).toBe(false);
    });
  });

  describe('getPlayerRoom', () => {
    let roomId: string;

    beforeEach(() => {
      const room = roomManager.createRoom({
        password: 'testpass',
        creatorSessionId: 'creator123',
      });
      roomId = room.id;
    });

    it('should return room ID for player in room', () => {
      const playerRoom = roomManager.getPlayerRoom('creator123');
      expect(playerRoom).toBe(roomId);
    });

    it('should return null for player not in any room', () => {
      const playerRoom = roomManager.getPlayerRoom('nonexistent');
      expect(playerRoom).toBeNull();
    });

    it('should return null after player leaves room', () => {
      roomManager.leaveRoom('creator123');
      const playerRoom = roomManager.getPlayerRoom('creator123');
      expect(playerRoom).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should validate correct passwords', () => {
      const validPasswords = [
        'abc',
        'password123',
        'my-secure-password',
        'P@ssw0rd!',
        'a'.repeat(50),
      ];

      validPasswords.forEach(password => {
        const result = roomManager.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty or whitespace-only passwords', () => {
      const invalidPasswords = ['', '   ', '\t', '\n'];

      invalidPasswords.forEach(password => {
        const result = roomManager.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Password cannot be empty');
      });
    });

    it('should reject passwords that are too short', () => {
      const result = roomManager.validatePassword('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 3 characters long');
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'a'.repeat(51);
      const result = roomManager.validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be 50 characters or less');
    });

    it('should reject null or undefined passwords', () => {
      const result1 = roomManager.validatePassword(null as any);
      const result2 = roomManager.validatePassword(undefined as any);

      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Password is required');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Password is required');
    });
  });

  describe('getActiveRooms', () => {
    it('should return empty array when no rooms exist', () => {
      const rooms = roomManager.getActiveRooms();
      expect(rooms).toEqual([]);
    });

    it('should return all active rooms', () => {
      const room1 = roomManager.createRoom({
        password: 'pass1',
        creatorSessionId: 'creator1',
      });
      const room2 = roomManager.createRoom({
        password: 'pass2',
        creatorSessionId: 'creator2',
      });

      const rooms = roomManager.getActiveRooms();
      expect(rooms).toHaveLength(2);
      expect(rooms).toContainEqual(room1);
      expect(rooms).toContainEqual(room2);
    });
  });

  describe('getRoomCount', () => {
    it('should return 0 when no rooms exist', () => {
      expect(roomManager.getRoomCount()).toBe(0);
    });

    it('should return correct count of active rooms', () => {
      roomManager.createRoom({
        password: 'pass1',
        creatorSessionId: 'creator1',
      });
      expect(roomManager.getRoomCount()).toBe(1);

      roomManager.createRoom({
        password: 'pass2',
        creatorSessionId: 'creator2',
      });
      expect(roomManager.getRoomCount()).toBe(2);

      roomManager.leaveRoom('creator1');
      expect(roomManager.getRoomCount()).toBe(1);
    });
  });

  describe('cleanupExpiredRooms', () => {
    it('should not clean up recent rooms', () => {
      roomManager.createRoom({
        password: 'pass1',
        creatorSessionId: 'creator1',
      });

      const cleanedCount = roomManager.cleanupExpiredRooms();
      expect(cleanedCount).toBe(0);
      expect(roomManager.getRoomCount()).toBe(1);
    });

    it('should clean up expired rooms', () => {
      // Create room and manually set old timestamp
      const room = roomManager.createRoom({
        password: 'pass1',
        creatorSessionId: 'creator1',
      });

      // Manually set creation time to 25 hours ago
      const roomState = roomManager.getRoomState(room.id);
      if (roomState) {
        roomState.createdAt = Date.now() - 25 * 60 * 60 * 1000;
      }

      const cleanedCount = roomManager.cleanupExpiredRooms();
      expect(cleanedCount).toBe(1);
      expect(roomManager.getRoomCount()).toBe(0);
      expect(roomManager.getPlayerRoom('creator1')).toBeNull();
    });
  });
});
