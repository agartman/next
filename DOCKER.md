# Docker Setup for Chess Multiplayer Website

This project includes Docker configuration files to run both the frontend and backend services in containers.

## Prerequisites

- Docker Desktop (for macOS/Windows) or Docker Engine (for Linux)
- Docker Compose

## Files Created

1. `frontend/Dockerfile` - Docker configuration for the React frontend
2. `frontend/nginx.conf` - Nginx configuration for serving the frontend and proxying WebSocket connections
3. `backend/Dockerfile` - Docker configuration for the Node.js backend
4. `docker-compose.yml` - Orchestration file for running both services
5. `frontend/.env` - Environment variables for the frontend
6. `frontend/.dockerignore` and `backend/.dockerignore` - Files to exclude from Docker builds

## Running with Docker

1. Start Docker Desktop (macOS/Windows) or ensure Docker daemon is running (Linux)

2. Build and run the containers:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:3001

4. To stop the containers:
   ```bash
   docker-compose down
   ```

## Environment Variables

The frontend connects to the backend using the `VITE_BACKEND_URL` environment variable, which is set in the docker-compose.yml file to `http://backend:3001` for container-to-container communication.

## Development vs Production

The Docker setup is configured for production:
- Frontend is built and served with Nginx
- Backend runs the compiled JavaScript files
- Environment variables are set in docker-compose.yml

For development, continue using the standard npm commands:
- `npm run dev` (runs both frontend and backend in development mode)
- `npm run dev:frontend` (runs only frontend in development mode)
- `npm run dev:backend` (runs only backend in development mode)