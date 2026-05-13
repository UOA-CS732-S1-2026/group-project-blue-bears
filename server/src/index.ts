import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import protectedRoutes from './routes/protectedRoutes';
import { registerSocketHandlers } from './socket/roomManager';

const connectDB: () => Promise<void> = require("../config/db");

dotenv.config();
import passageRoutes from "./routes/passageRoutes";

const app = express();
const port = Number(process.env.PORT) || 5000;
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: clientOrigin }));
app.use(express.json());
app.use("/api/passage", passageRoutes);

app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

io.use((socket, next) => {
  const token = (socket.handshake.auth as { token?: string }).token;
  if (!token) return next(); // guest — no enforcement

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    socket.data.userId = decoded.userId;

    // Find any existing authenticated socket for this userId and kick it.
    // Using socket.data (set at connect-time on the live object) avoids the stale-ID
    // problem of a separate Map: reconnects get a new ID but socket.data.userId stays
    // accurate. The incoming socket is not yet in io.sockets.sockets during middleware.
    for (const [, existing] of io.sockets.sockets) {
      if (existing.data?.userId === decoded.userId) {
        existing.emit('session_expired', { reason: 'signed_in_elsewhere' });
        break;
      }
    }

    next();
  } catch {
    next(); // invalid token — treat as guest
  }
});

registerSocketHandlers(io);

const startServer = async () => {
  try {
    await connectDB();
  } catch (err: unknown) {
    console.error("Database connection unavailable. Continuing without DB-backed routes:", err);
  }

  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

startServer().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});