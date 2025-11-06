# Development Guide for Agentic Coding

## Build Commands
- `npm run build` - Build both frontend and backend
- `npm run build:frontend` - Build only frontend
- `npm run build:backend` - Build only backend

## Development Commands
- `npm run dev` - Run both frontend and backend in development mode
- `npm run dev:frontend` - Run only frontend in development mode
- `npm run dev:backend` - Run only backend in development mode

## Linting Commands
- `npm run lint` - Lint both frontend and backend
- `npm run lint:frontend` - Lint only frontend
- `npm run lint:backend` - Lint only backend
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting with Prettier

## Test Commands
- `npm run test` - Run all tests for both frontend and backend
- `npm run test:frontend` - Run frontend tests with Vitest
- `npm run test:backend` - Run backend tests with Jest
- Run single frontend test: `cd frontend && npx vitest --run src/components/ComponentName.test.tsx`
- Run single backend test: `cd backend && npx jest src/managers/ManagerName.test.ts`
- Run frontend tests in watch mode: `cd frontend && npx vitest`
- Run backend tests in watch mode: `cd backend && npx jest --watch`

## Code Style Guidelines
1. Use TypeScript for type safety
2. Follow Prettier formatting (singleQuote: true, semi: true, trailingComma: es5)
3. Use functional components in React with hooks
4. Use styled-components for styling
5. Sort imports alphabetically, separate by type (external/internal)
6. Use named exports instead of default exports
7. Use PascalCase for components and interfaces, camelCase for variables/functions
8. Use descriptive variable names and add JSDoc comments for complex functions
9. Handle errors gracefully with try/catch blocks
10. Use async/await instead of callbacks for asynchronous operations

## Project Structure
- `backend/` - Node.js server with WebSocket support
- `frontend/` - React client with styled-components
- Key backend files: `src/server.ts`, `src/managers/`, `src/handlers/`
- Key frontend files: `src/components/`, `src/pages/`, `src/hooks/`