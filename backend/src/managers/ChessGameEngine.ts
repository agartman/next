/**
 * Chess Game Engine - Manages chess game logic and state using Chess.js
 */

import { Chess } from 'chess.js';
import { ChessGameState, ChessMove, GameResult } from '../types/room';

export class ChessGameEngine {
    private games: Map<string, Chess> = new Map();
    private gameStates: Map<string, ChessGameState> = new Map();
    private drawOffers: Map<string, string> = new Map(); // roomId -> playerId who offered draw

    /**
     * Initialize a new chess game for a room
     */
    public initializeGame(roomId: string, _whitePlayerId: string, _blackPlayerId: string): void {
        const chess = new Chess();
        this.games.set(roomId, chess);
        
        const initialState: ChessGameState = {
            fen: chess.fen(),
            turn: 'white',
            moveHistory: [],
            isCheck: false,
            isCheckmate: false,
            isStalemate: false,
            drawOffered: false
        };
        
        this.gameStates.set(roomId, initialState);
        this.drawOffers.delete(roomId);
    }

    /**
     * Make a move in the specified game
     */
    public makeMove(roomId: string, playerId: string, move: ChessMove): boolean {
        const chess = this.games.get(roomId);
        const gameState = this.gameStates.get(roomId);
        
        if (!chess || !gameState) {
            return false;
        }

        // Validate that it's the player's turn
        const playerColor = this.getPlayerColor(roomId, playerId);
        if (!playerColor || playerColor !== gameState.turn) {
            return false;
        }

        try {
            // Attempt to make the move using Chess.js
            const chessMove = chess.move({
                from: move.from,
                to: move.to,
                promotion: 'q' // Always promote to queen for simplicity
            });

            if (!chessMove) {
                return false;
            }

            // Update our game state
            const updatedMove: ChessMove = {
                from: move.from,
                to: move.to,
                piece: chessMove.piece,
                timestamp: Date.now()
            };

            gameState.fen = chess.fen();
            gameState.turn = chess.turn() === 'w' ? 'white' : 'black';
            gameState.moveHistory.push(updatedMove);
            gameState.isCheck = chess.inCheck();
            gameState.isCheckmate = chess.isCheckmate();
            gameState.isStalemate = chess.isStalemate();
            gameState.drawOffered = false; // Clear any pending draw offers after a move
            
            this.drawOffers.delete(roomId);
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate if a move is legal without making it
     */
    public validateMove(roomId: string, move: ChessMove): boolean {
        const chess = this.games.get(roomId);
        if (!chess) {
            return false;
        }

        try {
            // Create a copy to test the move
            const testChess = new Chess(chess.fen());
            const result = testChess.move({
                from: move.from,
                to: move.to,
                promotion: 'q'
            });
            
            return result !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the current game state for a room
     */
    public getGameState(roomId: string): ChessGameState | null {
        return this.gameStates.get(roomId) || null;
    }

    /**
     * Check if the game is over and return the result
     */
    public isGameOver(roomId: string): GameResult | null {
        const chess = this.games.get(roomId);
        if (!chess) {
            return null;
        }

        if (chess.isCheckmate()) {
            const winner = chess.turn() === 'w' ? 'black' : 'white'; // Opposite of current turn
            return {
                winner,
                reason: 'checkmate'
            };
        }

        if (chess.isStalemate()) {
            return {
                winner: 'draw',
                reason: 'stalemate'
            };
        }

        if (chess.isDraw()) {
            return {
                winner: 'draw',
                reason: 'draw'
            };
        }

        return null;
    }

    /**
     * Handle a draw offer from a player
     */
    public offerDraw(roomId: string, playerId: string): void {
        const gameState = this.gameStates.get(roomId);
        if (gameState) {
            this.drawOffers.set(roomId, playerId);
            gameState.drawOffered = true;
        }
    }

    /**
     * Accept a draw offer
     */
    public acceptDraw(roomId: string, playerId: string): GameResult | null {
        const offeringPlayer = this.drawOffers.get(roomId);
        if (offeringPlayer && offeringPlayer !== playerId) {
            this.drawOffers.delete(roomId);
            const gameState = this.gameStates.get(roomId);
            if (gameState) {
                gameState.drawOffered = false;
            }
            return {
                winner: 'draw',
                reason: 'draw'
            };
        }
        return null;
    }

    /**
     * Decline a draw offer
     */
    public declineDraw(roomId: string): void {
        this.drawOffers.delete(roomId);
        const gameState = this.gameStates.get(roomId);
        if (gameState) {
            gameState.drawOffered = false;
        }
    }

    /**
     * Handle a player resignation
     */
    public resign(roomId: string, playerId: string): GameResult | null {
        const playerColor = this.getPlayerColor(roomId, playerId);
        if (!playerColor) {
            return null;
        }

        const winner = playerColor === 'white' ? 'black' : 'white';
        return {
            winner,
            reason: 'resignation'
        };
    }

    /**
     * Get valid moves for a piece at a specific position
     */
    public getValidMoves(roomId: string, square: string): string[] {
        const chess = this.games.get(roomId);
        if (!chess) {
            return [];
        }

        try {
            const moves = chess.moves({ square: square as any, verbose: true });
            return moves.map((move: any) => move.to);
        } catch (error) {
            return [];
        }
    }

    /**
     * Clean up a game when the room is closed
     */
    public cleanupGame(roomId: string): void {
        this.games.delete(roomId);
        this.gameStates.delete(roomId);
        this.drawOffers.delete(roomId);
    }

    /**
     * Helper method to determine player color (this would need to be implemented
     * based on how players are associated with rooms)
     */
    private getPlayerColor(_roomId: string, _playerId: string): 'white' | 'black' | null {
        // This is a placeholder - in a real implementation, this would
        // look up the player's color from the room data
        // For now, we'll assume this information is available elsewhere
        return null;
    }
}