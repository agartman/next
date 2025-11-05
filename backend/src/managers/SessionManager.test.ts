import { SessionManager } from './SessionManager';
import { SessionCreationOptions } from '../types/session';

describe('SessionManager', () => {
    let sessionManager: SessionManager;

    beforeEach(() => {
        sessionManager = new SessionManager();
    });

    describe('createSession', () => {
        it('should create a valid session with proper nickname', () => {
            const options: SessionCreationOptions = {
                nickname: 'TestPlayer',
                socketId: 'socket123'
            };

            const session = sessionManager.createSession(options);

            expect(session).toBeDefined();
            expect(session.nickname).toBe('TestPlayer');
            expect(session.socketId).toBe('socket123');
            expect(session.currentRoom).toBeNull();
            expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
            expect(typeof session.createdAt).toBe('number');
            expect(session.createdAt).toBeLessThanOrEqual(Date.now());
        });

        it('should trim whitespace from nickname', () => {
            const options: SessionCreationOptions = {
                nickname: '  TestPlayer  ',
                socketId: 'socket123'
            };

            const session = sessionManager.createSession(options);
            expect(session.nickname).toBe('TestPlayer');
        });

        it('should throw error for invalid nickname', () => {
            const options: SessionCreationOptions = {
                nickname: '',
                socketId: 'socket123'
            };

            expect(() => sessionManager.createSession(options)).toThrow('Nickname cannot be empty');
        });

        it('should generate unique session IDs', () => {
            const session1 = sessionManager.createSession({
                nickname: 'Player1',
                socketId: 'socket1'
            });

            const session2 = sessionManager.createSession({
                nickname: 'Player2',
                socketId: 'socket2'
            });

            expect(session1.id).not.toBe(session2.id);
        });
    });

    describe('getSession', () => {
        it('should retrieve session by socket ID', () => {
            const options: SessionCreationOptions = {
                nickname: 'TestPlayer',
                socketId: 'socket123'
            };

            const createdSession = sessionManager.createSession(options);
            const retrievedSession = sessionManager.getSession('socket123');

            expect(retrievedSession).toEqual(createdSession);
        });

        it('should return null for non-existent socket ID', () => {
            const session = sessionManager.getSession('nonexistent');
            expect(session).toBeNull();
        });
    });

    describe('getSessionById', () => {
        it('should retrieve session by session ID', () => {
            const options: SessionCreationOptions = {
                nickname: 'TestPlayer',
                socketId: 'socket123'
            };

            const createdSession = sessionManager.createSession(options);
            const retrievedSession = sessionManager.getSessionById(createdSession.id);

            expect(retrievedSession).toEqual(createdSession);
        });

        it('should return null for non-existent session ID', () => {
            const session = sessionManager.getSessionById('nonexistent');
            expect(session).toBeNull();
        });
    });

    describe('removeSession', () => {
        it('should remove session and return true for existing socket', () => {
            const options: SessionCreationOptions = {
                nickname: 'TestPlayer',
                socketId: 'socket123'
            };

            sessionManager.createSession(options);
            const removed = sessionManager.removeSession('socket123');

            expect(removed).toBe(true);
            expect(sessionManager.getSession('socket123')).toBeNull();
        });

        it('should return false for non-existent socket', () => {
            const removed = sessionManager.removeSession('nonexistent');
            expect(removed).toBe(false);
        });

        it('should clean up both session and socket mapping', () => {
            const options: SessionCreationOptions = {
                nickname: 'TestPlayer',
                socketId: 'socket123'
            };

            const session = sessionManager.createSession(options);
            sessionManager.removeSession('socket123');

            expect(sessionManager.getSession('socket123')).toBeNull();
            expect(sessionManager.getSessionById(session.id)).toBeNull();
        });
    });

    describe('validateNickname', () => {
        it('should validate correct nicknames', () => {
            const validNicknames = [
                'Player1',
                'Test_Player',
                'User-123',
                'My Name',
                'ab',
                'a'.repeat(20)
            ];

            validNicknames.forEach(nickname => {
                const result = sessionManager.validateNickname(nickname);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeUndefined();
            });
        });

        it('should reject empty or whitespace-only nicknames', () => {
            const invalidNicknames = ['', '   ', '\t', '\n'];

            invalidNicknames.forEach(nickname => {
                const result = sessionManager.validateNickname(nickname);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('Nickname cannot be empty');
            });
        });

        it('should reject nicknames that are too short', () => {
            const result = sessionManager.validateNickname('a');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Nickname must be at least 2 characters long');
        });

        it('should reject nicknames that are too long', () => {
            const longNickname = 'a'.repeat(21);
            const result = sessionManager.validateNickname(longNickname);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Nickname must be 20 characters or less');
        });

        it('should reject nicknames with invalid characters', () => {
            const invalidNicknames = ['Player@123', 'Test#Player', 'User$Name', 'Player!'];

            invalidNicknames.forEach(nickname => {
                const result = sessionManager.validateNickname(nickname);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('Nickname can only contain letters, numbers, spaces, underscores, and hyphens');
            });
        });

        it('should reject null or undefined nicknames', () => {
            const result1 = sessionManager.validateNickname(null as any);
            const result2 = sessionManager.validateNickname(undefined as any);

            expect(result1.isValid).toBe(false);
            expect(result1.error).toBe('Nickname is required');
            expect(result2.isValid).toBe(false);
            expect(result2.error).toBe('Nickname is required');
        });
    });

    describe('updateSessionRoom', () => {
        it('should update room for existing session', () => {
            const options: SessionCreationOptions = {
                nickname: 'TestPlayer',
                socketId: 'socket123'
            };

            sessionManager.createSession(options);
            const updated = sessionManager.updateSessionRoom('socket123', 'room456');

            expect(updated).toBe(true);
            const session = sessionManager.getSession('socket123');
            expect(session?.currentRoom).toBe('room456');
        });

        it('should clear room when setting to null', () => {
            const options: SessionCreationOptions = {
                nickname: 'TestPlayer',
                socketId: 'socket123'
            };

            sessionManager.createSession(options);
            sessionManager.updateSessionRoom('socket123', 'room456');
            const updated = sessionManager.updateSessionRoom('socket123', null);

            expect(updated).toBe(true);
            const session = sessionManager.getSession('socket123');
            expect(session?.currentRoom).toBeNull();
        });

        it('should return false for non-existent session', () => {
            const updated = sessionManager.updateSessionRoom('nonexistent', 'room456');
            expect(updated).toBe(false);
        });
    });

    describe('getActiveSessions', () => {
        it('should return empty array when no sessions exist', () => {
            const sessions = sessionManager.getActiveSessions();
            expect(sessions).toEqual([]);
        });

        it('should return all active sessions', () => {
            const options1: SessionCreationOptions = {
                nickname: 'Player1',
                socketId: 'socket1'
            };
            const options2: SessionCreationOptions = {
                nickname: 'Player2',
                socketId: 'socket2'
            };

            const session1 = sessionManager.createSession(options1);
            const session2 = sessionManager.createSession(options2);

            const sessions = sessionManager.getActiveSessions();
            expect(sessions).toHaveLength(2);
            expect(sessions).toContainEqual(session1);
            expect(sessions).toContainEqual(session2);
        });
    });

    describe('getSessionCount', () => {
        it('should return 0 when no sessions exist', () => {
            expect(sessionManager.getSessionCount()).toBe(0);
        });

        it('should return correct count of active sessions', () => {
            sessionManager.createSession({
                nickname: 'Player1',
                socketId: 'socket1'
            });
            expect(sessionManager.getSessionCount()).toBe(1);

            sessionManager.createSession({
                nickname: 'Player2',
                socketId: 'socket2'
            });
            expect(sessionManager.getSessionCount()).toBe(2);

            sessionManager.removeSession('socket1');
            expect(sessionManager.getSessionCount()).toBe(1);
        });
    });
});