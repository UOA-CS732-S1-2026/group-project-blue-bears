import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
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