import { PlayerSession, SessionValidationResult, SessionCreationOptions } from '../types/session';

/**
 * SessionManager handles temporary player sessions with full type safety
 * Manages session creation, validation, and cleanup
 */
export class SessionManager {
  private sessions: Map<string, PlayerSession> = new Map();
  private socketToSessionId: Map<string, string> = new Map();

  /**
   * Creates a new player session with nickname validation
   */
  createSession(options: SessionCreationOptions): PlayerSession {
    const validation = this.validateNickname(options.nickname);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid nickname');
    }

    // Generate unique session ID
    const sessionId = this.generateSessionId();

    const session: PlayerSession = {
      id: sessionId,
      nickname: options.nickname.trim(),
      socketId: options.socketId,
      currentRoom: null,
      createdAt: Date.now(),
    };

    // Store session and socket mapping
    this.sessions.set(sessionId, session);
    this.socketToSessionId.set(options.socketId, sessionId);

    return session;
  }

  /**
   * Retrieves a session by socket ID
   */
  getSession(socketId: string): PlayerSession | null {
    const sessionId = this.socketToSessionId.get(socketId);
    if (!sessionId) {
      return null;
    }
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Retrieves a session by session ID
   */
  getSessionById(sessionId: string): PlayerSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Removes a session and cleans up associated data
   */
  removeSession(socketId: string): boolean {
    const sessionId = this.socketToSessionId.get(socketId);
    if (!sessionId) {
      return false;
    }

    // Remove from both maps
    this.sessions.delete(sessionId);
    this.socketToSessionId.delete(socketId);

    return true;
  }

  /**
   * Validates nickname according to requirements
   */
  validateNickname(nickname: string): SessionValidationResult {
    if (nickname === null || nickname === undefined || typeof nickname !== 'string') {
      return {
        isValid: false,
        error: 'Nickname is required',
      };
    }

    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length === 0) {
      return {
        isValid: false,
        error: 'Nickname cannot be empty',
      };
    }

    if (trimmedNickname.length < 2) {
      return {
        isValid: false,
        error: 'Nickname must be at least 2 characters long',
      };
    }

    if (trimmedNickname.length > 20) {
      return {
        isValid: false,
        error: 'Nickname must be 20 characters or less',
      };
    }

    // Check for valid characters (alphanumeric, spaces, underscores, hyphens)
    const validNicknameRegex = /^[a-zA-Z0-9\s_-]+$/;
    if (!validNicknameRegex.test(trimmedNickname)) {
      return {
        isValid: false,
        error: 'Nickname can only contain letters, numbers, spaces, underscores, and hyphens',
      };
    }

    return { isValid: true };
  }

  /**
   * Updates the current room for a session
   */
  updateSessionRoom(socketId: string, roomId: string | null): boolean {
    const session = this.getSession(socketId);
    if (!session) {
      return false;
    }

    session.currentRoom = roomId;
    return true;
  }

  /**
   * Gets all active sessions (for debugging/monitoring)
   */
  getActiveSessions(): PlayerSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Gets the total number of active sessions
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Generates a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
