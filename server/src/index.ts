import express from "express";
import dotenv from "dotenv";
import authRoutes from './routes/auth';

const connectDB: () => Promise<void> = require("../config/db");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

const startServer = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

startServer().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
