import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SessionManager } from './managers/SessionManager';
import { RoomManager } from './managers/RoomManager';
import { ChessGameEngine } from './managers/ChessGameEngine';
import { WebSocketHandler } from './handlers/WebSocketHandler';
import { 
    ClientToServerEvents, 
    ServerToClientEvents, 
    InterServerEvents, 
    SocketData 
} from './types/websocket';

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Initialize managers
const sessionManager = new SessionManager();
const roomManager = new RoomManager();
const gameEngine = new ChessGameEngine();

// Initialize WebSocket handler
new WebSocketHandler(io, sessionManager, roomManager, gameEngine);

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        message: 'Chess backend server is running',
        activeSessions: sessionManager.getSessionCount(),
        activeRooms: roomManager.getRoomCount()
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Chess backend server running on port ${PORT}`);
});