import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SessionManager } from './managers/SessionManager';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Initialize session manager
const sessionManager = new SessionManager();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        message: 'Chess backend server is running',
        activeSessions: sessionManager.getSessionCount()
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle session creation when user provides nickname
    socket.on('create-session', (data: { nickname: string }) => {
        try {
            const session = sessionManager.createSession({
                nickname: data.nickname,
                socketId: socket.id
            });

            socket.emit('session-created', {
                success: true,
                session: {
                    id: session.id,
                    nickname: session.nickname
                }
            });

            console.log(`Session created for ${session.nickname} (${session.id})`);
        } catch (error) {
            socket.emit('session-created', {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create session'
            });
        }
    });

    // Handle disconnect - cleanup session
    socket.on('disconnect', () => {
        const session = sessionManager.getSession(socket.id);
        if (session) {
            console.log(`User ${session.nickname} disconnected (${session.id})`);
            sessionManager.removeSession(socket.id);
        } else {
            console.log('User disconnected:', socket.id);
        }
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Chess backend server running on port ${PORT}`);
});