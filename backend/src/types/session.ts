/**
 * TypeScript interfaces for session management
 */

export interface PlayerSession {
  id: string;
  nickname: string;
  socketId: string;
  currentRoom: string | null;
  createdAt: number;
}

export interface SessionValidationResult {
  isValid: boolean;
  error?: string;
}

export interface SessionCreationOptions {
  nickname: string;
  socketId: string;
}
