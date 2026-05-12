# Type-of-War - Server

Express + TypeScript backend for Type-of-War, with Socket.IO for real-time race events and MongoDB for persistence.

For full project documentation, deployment notes, and setup instructions see the [root README](../README.md).

## Render Free Tier Cold Start

This server is hosted on Render's free tier. **After 15 minutes of inactivity the server sleeps.** The first request after an idle period may take **up to 1 minute** to respond while the server wakes up. Subsequent requests are unaffected.

## Running The Project

```bash
npm install
npm run build
npm run dev
```

Runs at `http://localhost:5000` by default.

## Environment Variables

Create a `.env` file in this directory:

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

## Structure

```
src/
├── index.ts                  # Entry point
├── routes/                   # auth, protectedRoutes, passageRoutes
├── controllers/              # authController, profileController, resultsController, leaderboardController, passageController
├── middleware/               # authenticate, validateRequest
├── models/                   # User, Match (Mongoose schemas)
└── socket/
    └── roomManager.ts        # In-memory room state and all Socket.IO event handlers
data-access/
├── userDataAccess.js
├── matchDataAccess.js
├── profileHistoryDataAccess.js
└── leaderboardDataAccess.js
config/
└── db.js                     # MongoDB connection
```

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive JWT |
| GET | `/api/profile` | JWT | Current user profile and stats |
| GET | `/api/results` | JWT | Paginated match history |
| GET | `/api/leaderboard` | JWT | Global leaderboard |
| GET | `/api/passage` | No | Random typing passage |

## Socket.IO Events

| Event (client → server) | Description |
|---|---|
| `create_room` | Create a new lobby |
| `join_room` | Join an existing lobby by room code |
| `probe_room` | Check room occupancy without joining |
| `ready_up` | Mark player as ready to race |
| `progress_update` | Broadcast live WPM/progress to opponent |
| `race_complete` | Submit final race result |
| `ready_for_rematch` | Signal intent to play again |
| `left_result_screen` | Notify server of navigation away from results |
| `leave_lobby` | Leave a lobby before the race starts |

## Tests

```bash
npm run test
```

Jest + Supertest tests cover the `authenticate` middleware and all auth and protected API routes.
