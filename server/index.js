const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'));

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
});

server.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`));