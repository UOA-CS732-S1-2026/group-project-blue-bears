import express from "express";
import dotenv from "dotenv";
import authRoutes from './routes/auth';
import protectedRoutes from './routes/protectedRoutes';

const connectDB: () => Promise<void> = require("../config/db");

dotenv.config();
import passageRoutes from "./routes/passageRoutes";

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use("/api/passage", passageRoutes);

app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

const startServer = async () => {
  try {
    await connectDB();
  } catch (err: unknown) {
    console.error("Database connection unavailable. Continuing without DB-backed routes:", err);
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

startServer().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
