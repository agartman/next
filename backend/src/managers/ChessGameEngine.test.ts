import { ChessGameEngine } from './ChessGameEngine';
import { ChessMove } from '../types/room';

describe('ChessGameEngine', () => {
    let chessEngine: ChessGameEngine;
    const roomId = 'test-room-123';
    const whitePlayerId = 'white-player';
    const blackPlayerId = 'black-player';

    beforeEach(() => {
        chessEngine = new ChessGameEngine();
    });

    describe('initializeGame', () => {
        it('should initialize a new chess game with starting position', () => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
            
            const gameState = chessEngine.getGameState(roomId);
            
            expect(gameState).toBeDefined();
            expect(gameState?.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            expect(gameState?.turn).toBe('white');
            expect(gameState?.moveHistory).toEqual([]);
            expect(gameState?.isCheck).toBe(false);
            expect(gameState?.isCheckmate).toBe(false);
            expect(gameState?.isStalemate).toBe(false);
            expect(gameState?.drawOffered).toBe(false);
        });

        it('should clear any existing draw offers when initializing', () => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
            chessEngine.offerDraw(roomId, whitePlayerId);
            
            // Re-initialize the game
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState?.drawOffered).toBe(false);
        });
    });

    describe('validateMove', () => {
        beforeEach(() => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
        });

        it('should validate legal opening moves', () => {
            const validMoves: ChessMove[] = [
                { from: 'e2', to: 'e4', piece: 'p', timestamp: Date.now() },
                { from: 'd2', to: 'd4', piece: 'p', timestamp: Date.now() },
                { from: 'g1', to: 'f3', piece: 'n', timestamp: Date.now() },
                { from: 'b1', to: 'c3', piece: 'n', timestamp: Date.now() }
            ];

            validMoves.forEach(move => {
                const isValid = chessEngine.validateMove(roomId, move);
                expect(isValid).toBe(true);
            });
        });

        it('should reject illegal moves', () => {
            const invalidMoves: ChessMove[] = [
                { from: 'e2', to: 'e5', piece: 'p', timestamp: Date.now() }, // Pawn can't move 3 squares
                { from: 'e1', to: 'e2', piece: 'k', timestamp: Date.now() }, // King blocked by pawn
                { from: 'f1', to: 'a6', piece: 'b', timestamp: Date.now() }, // Bishop blocked by pawn
                { from: 'a1', to: 'a3', piece: 'r', timestamp: Date.now() }  // Rook blocked by pawn
            ];

            invalidMoves.forEach(move => {
                const isValid = chessEngine.validateMove(roomId, move);
                expect(isValid).toBe(false);
            });
        });

        it('should return false for non-existent room', () => {
            const move: ChessMove = { from: 'e2', to: 'e4', piece: 'p', timestamp: Date.now() };
            const isValid = chessEngine.validateMove('non-existent-room', move);
            expect(isValid).toBe(false);
        });
    });

    describe('makeMove', () => {
        beforeEach(() => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
        });

        it('should make a valid move and update game state', () => {
            // Mock the getPlayerColor method to return 'white' for the white player
            const originalGetPlayerColor = (chessEngine as any).getPlayerColor;
            (chessEngine as any).getPlayerColor = jest.fn((_roomId: string, playerId: string) => {
                if (playerId === whitePlayerId) return 'white';
                if (playerId === blackPlayerId) return 'black';
                return null;
            });

            const move: ChessMove = { from: 'e2', to: 'e4', piece: 'p', timestamp: Date.now() };
            const success = chessEngine.makeMove(roomId, whitePlayerId, move);
            
            expect(success).toBe(true);
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState?.turn).toBe('black');
            expect(gameState?.moveHistory).toHaveLength(1);
            expect(gameState?.moveHistory[0].from).toBe('e2');
            expect(gameState?.moveHistory[0].to).toBe('e4');
            expect(gameState?.fen).toContain('4P3'); // FEN should reflect the pawn move to e4

            // Restore original method
            (chessEngine as any).getPlayerColor = originalGetPlayerColor;
        });

        it('should reject move when it is not the player\'s turn', () => {
            // Mock the getPlayerColor method
            (chessEngine as any).getPlayerColor = jest.fn((_roomId: string, playerId: string) => {
                if (playerId === whitePlayerId) return 'white';
                if (playerId === blackPlayerId) return 'black';
                return null;
            });

            const move: ChessMove = { from: 'e7', to: 'e5', piece: 'p', timestamp: Date.now() };
            const success = chessEngine.makeMove(roomId, blackPlayerId, move); // Black trying to move first
            
            expect(success).toBe(false);
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState?.turn).toBe('white'); // Should still be white's turn
            expect(gameState?.moveHistory).toHaveLength(0);
        });

        it('should clear draw offers after a move is made', () => {
            // Mock the getPlayerColor method
            (chessEngine as any).getPlayerColor = jest.fn((_roomId: string, playerId: string) => {
                if (playerId === whitePlayerId) return 'white';
                if (playerId === blackPlayerId) return 'black';
                return null;
            });

            chessEngine.offerDraw(roomId, whitePlayerId);
            
            const move: ChessMove = { from: 'e2', to: 'e4', piece: 'p', timestamp: Date.now() };
            chessEngine.makeMove(roomId, whitePlayerId, move);
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState?.drawOffered).toBe(false);
        });

        it('should return false for non-existent room', () => {
            const move: ChessMove = { from: 'e2', to: 'e4', piece: 'p', timestamp: Date.now() };
            const success = chessEngine.makeMove('non-existent-room', whitePlayerId, move);
            expect(success).toBe(false);
        });
    });

    describe('isGameOver', () => {
        beforeEach(() => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
        });

        it('should return null for ongoing game', () => {
            const result = chessEngine.isGameOver(roomId);
            expect(result).toBeNull();
        });

        it('should return null for non-existent room', () => {
            const result = chessEngine.isGameOver('non-existent-room');
            expect(result).toBeNull();
        });

        // Note: Testing actual checkmate scenarios would require setting up specific board positions
        // which is complex with the current Chess.js integration. In a real implementation,
        // you might want to add methods to set up specific positions for testing.
    });

    describe('offerDraw and draw handling', () => {
        beforeEach(() => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
        });

        it('should offer draw and update game state', () => {
            chessEngine.offerDraw(roomId, whitePlayerId);
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState?.drawOffered).toBe(true);
        });

        it('should accept draw from different player', () => {
            chessEngine.offerDraw(roomId, whitePlayerId);
            const result = chessEngine.acceptDraw(roomId, blackPlayerId);
            
            expect(result).toEqual({
                winner: 'draw',
                reason: 'draw'
            });
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState?.drawOffered).toBe(false);
        });

        it('should not accept draw from same player who offered', () => {
            chessEngine.offerDraw(roomId, whitePlayerId);
            const result = chessEngine.acceptDraw(roomId, whitePlayerId);
            
            expect(result).toBeNull();
        });

        it('should decline draw and clear offer', () => {
            chessEngine.offerDraw(roomId, whitePlayerId);
            chessEngine.declineDraw(roomId);
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState?.drawOffered).toBe(false);
        });
    });

    describe('resign', () => {
        beforeEach(() => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
        });

        it('should handle resignation and return correct winner', () => {
            // Mock the getPlayerColor method
            (chessEngine as any).getPlayerColor = jest.fn((_roomId: string, playerId: string) => {
                if (playerId === whitePlayerId) return 'white';
                if (playerId === blackPlayerId) return 'black';
                return null;
            });

            const result = chessEngine.resign(roomId, whitePlayerId);
            
            expect(result).toEqual({
                winner: 'black',
                reason: 'resignation'
            });
        });

        it('should return null for unknown player', () => {
            const result = chessEngine.resign(roomId, 'unknown-player');
            expect(result).toBeNull();
        });
    });

    describe('getValidMoves', () => {
        beforeEach(() => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
        });

        it('should return valid moves for a piece', () => {
            const validMoves = chessEngine.getValidMoves(roomId, 'e2');
            expect(validMoves).toContain('e3');
            expect(validMoves).toContain('e4');
            expect(validMoves).toHaveLength(2);
        });

        it('should return empty array for invalid square', () => {
            const validMoves = chessEngine.getValidMoves(roomId, 'e3'); // Empty square
            expect(validMoves).toEqual([]);
        });

        it('should return empty array for non-existent room', () => {
            const validMoves = chessEngine.getValidMoves('non-existent-room', 'e2');
            expect(validMoves).toEqual([]);
        });
    });

    describe('cleanupGame', () => {
        beforeEach(() => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
        });

        it('should clean up all game data', () => {
            chessEngine.offerDraw(roomId, whitePlayerId);
            
            chessEngine.cleanupGame(roomId);
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState).toBeNull();
            
            const validMoves = chessEngine.getValidMoves(roomId, 'e2');
            expect(validMoves).toEqual([]);
        });

        it('should handle cleanup of non-existent room gracefully', () => {
            expect(() => chessEngine.cleanupGame('non-existent-room')).not.toThrow();
        });
    });

    describe('getGameState', () => {
        it('should return null for non-existent room', () => {
            const gameState = chessEngine.getGameState('non-existent-room');
            expect(gameState).toBeNull();
        });

        it('should return current game state for existing room', () => {
            chessEngine.initializeGame(roomId, whitePlayerId, blackPlayerId);
            
            const gameState = chessEngine.getGameState(roomId);
            expect(gameState).toBeDefined();
            expect(gameState?.turn).toBe('white');
        });
    });
});