# Type-of-War

Type-of-War is a real-time typing game built around a tug-of-war style race. Two players join a shared room, type the same passage, and compete through Socket.IO-driven progress updates until one player wins or the timer runs out. The app also includes authentication, profile history, a leaderboard, and match result persistence.

## Project Structure

This repository is split into a React frontend and an Express + Socket.IO backend.

### Root

- `client/` - Vite + React + TypeScript frontend
- `server/` - Express + TypeScript backend with MongoDB and Socket.IO

### Client

- `src/App.tsx` - application routing
- `src/pages/` - page-level screens for the landing page, auth, lobby flow, game, results, profile, leaderboard, and a graphics test page
- `src/components/` - shared UI pieces such as the typing display, game canvas, rope visual, result banner, stats table, and lobby/auth components
- `src/hooks/` - game and socket hooks
- `src/services/` - API helpers for auth and profile requests
- `src/socket.ts` - Socket.IO client singleton

Main routes currently used by the app include:

- `/` - landing page
- `/login` and `/register` - authentication
- `/lobby` and `/join` - room creation and room joining
- `/game` - live race view
- `/result` - race summary screen
- `/leaderboard` - global leaderboard
- `/profile` - user profile and match history

### Server

- `src/index.ts` - server bootstrap, middleware, routes, and Socket.IO setup
- `src/routes/` - API routes for auth, passages, and protected data
- `src/controllers/` - request handlers for auth, leaderboard, passage, profile, and result data
- `src/middleware/` - request validation and JWT authentication
- `src/socket/roomManager.ts` - in-memory room handling and race event coordination
- `src/models/` - MongoDB models for users and matches
- `data-access/` - persistence helpers used by the server
- `config/db.js` - MongoDB connection setup

## Current Features

- Real-time 1v1 typing races using Socket.IO
- Lobby creation and room joining for multiplayer matches
- Passage retrieval from local word list
- JWT-based authentication with bcrypt password hashing
- Match result storage in MongoDB
- Profile and history views for authenticated users
- Global leaderboard support
- Typing game UI with rope/tug-of-war visuals and result summaries

## Game Logic

### Win Condition

The primary win condition is **finishing the passage first**. Two players are presented with a randomly-generated 50-word passage and must type it as accurately as possible:

- **First to complete**: The player who types all words first wins immediately and ends the race
- **Timeout fallback**: If no one finishes within 60 seconds, the race ends and the player with the highest WPM (words per minute) is declared the winner
- **Accuracy matters**: Both WPM and accuracy are tracked and persist in match results; the winner is determined solely by completion order or WPM on timeout, but accuracy is recorded for leaderboard and profile history

### Passage Generation

- Passages are generated server-side from a local word list (`commonWords.json`)
- Each race gets a fresh 50-word passage randomly selected from the word list
- Passages are deterministic per game (both players type the same passage simultaneously)

### Match Flow

1. Players join a lobby using room codes or by creating a new room
2. Both players must reach "ready" state
3. A 3-second countdown begins
4. Race starts and progress is tracked in real-time via Socket.IO
5. First player to complete or highest WPM at 60 seconds wins
6. Race results are persisted to MongoDB with winner, WPM, and accuracy for both players

## Testing

Tests are organized by module and located in `__tests__` directories within both client and server:

### Client Tests

- `src/__tests__/services/authService.test.ts` - Authentication service (login, registration)
- `src/__tests__/utils/calcStats.test.ts` - Typing statistics calculation (WPM, accuracy)
- `src/__tests__/utils/formatTime.test.ts` - Time formatting utilities

### Server Tests

- `src/__tests__/middleware/authenticate.test.ts` - JWT authentication middleware
- `src/__tests__/routes/auth.test.ts` - Authentication endpoints
- `src/__tests__/routes/api.test.ts` - Protected API routes

### Running Tests

```bash
# Client tests
cd client
npm test

# Server tests
cd server
npm test
```

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, Socket.IO client, Pixi.js
- Backend: Node.js, Express, TypeScript, Socket.IO, Mongoose, JWT, bcryptjs
- Database: MongoDB

## Running The Project

Install and run each app separately.

### Client

```bash
cd client
npm install
npm run dev
```

### Server

```bash
cd server
npm install
npm run dev
```

The client uses Vite's default dev server and the server listens on port `5000` by default.

## Team Members

- Andrew Jeon _(ajeo563@aucklanduni.ac.nz)_
- Caleb Jung _(cjun818@aucklanduni.ac.nz)_
- Lucas Jung _(ljun123@aucklanduni.ac.nz)_
- Kevin Kim _(kkim985@aucklanduni.ac.nz)_
- Muyuan Tong _(mton529@aucklanduni.ac.nz)_
- David Yu _(dyu343@aucklanduni.ac.nz)_
- Xiang Yang _(xyan824@aucklanduni.ac.nz)_