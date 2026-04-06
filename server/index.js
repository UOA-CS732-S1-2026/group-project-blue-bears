const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const startServer = async () => {
    await connectDB();

    server.listen(process.env.PORT, () =>
        console.log(`Server running on port ${process.env.PORT}`));
};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
});

startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});