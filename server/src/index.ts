import express from "express";
import dotenv from "dotenv";

const connectDB: () => Promise<void> = require("../config/db");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend works!" });
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
