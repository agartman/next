# Chess Multiplayer Website

A real-time multiplayer chess platform built with React, Node.js, and Socket.io.

## Project Structure

```
chess-multiplayer-website/
├── frontend/          # React frontend application
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/           # Node.js backend server
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
└── package.json       # Root package.json for managing both projects
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Install dependencies for both frontend and backend:
```bash
npm run install:all
```

Or install individually:
```bash
npm run install:frontend
npm run install:backend
```

### Development

1. Start both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

Or run individually:
```bash
npm run dev:backend  # Start backend only
npm run dev:frontend # Start frontend only
```

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Socket.io client for real-time communication
- Styled-components for styling
- Chess.js for chess logic

### Backend
- Node.js with Express and TypeScript
- Socket.io for WebSocket communication
- Chess.js for game logic validation
- Jest for testing

## Features

- Session-based gameplay (no account required)
- Password-protected game rooms
- Real-time move synchronization
- Full chess rule validation
- Responsive design for mobile and desktop