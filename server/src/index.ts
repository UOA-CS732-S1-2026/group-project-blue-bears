import express from "express";

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend works!" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});