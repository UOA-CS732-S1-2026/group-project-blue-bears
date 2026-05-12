# Type-of-War - Client

React + TypeScript frontend for Type-of-War, built with Vite.

For full project documentation, deployment notes, and setup instructions see the [root README](../README.md).

## Running The Project

```bash
npm install
npm run build
npm run dev
```

Runs at `http://localhost:5173` by default.

## Environment Variables

Create a `.env` file in this directory:

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Structure

```
src/
├── App.tsx      # Route definitions
├── pages/       # Full-page screen components
├── components/  # Reusable UI components
├── hooks/       # useGameLogic, useSocket
├── services/    # authService, profileService, leaderboardService
└── socket.ts    # Socket.IO singleton
```

## Tests

```bash
npm run test
```

Unit tests (Vitest) cover `authService`, `calcStats`, and `formatTime`.
