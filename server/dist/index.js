"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const auth_1 = __importDefault(require("./routes/auth"));
const protectedRoutes_1 = __importDefault(require("./routes/protectedRoutes"));
const roomManager_1 = require("./socket/roomManager");
const connectDB = require("../config/db");
dotenv_1.default.config();
const passageRoutes_1 = __importDefault(require("./routes/passageRoutes"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 5000;
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: clientOrigin,
        methods: ['GET', 'POST'],
    },
});
app.use((0, cors_1.default)({ origin: clientOrigin }));
app.use(express_1.default.json());
app.use("/api/passage", passageRoutes_1.default);
app.use('/auth', auth_1.default);
app.use('/api', protectedRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});
(0, roomManager_1.registerSocketHandlers)(io);
const startServer = async () => {
    try {
        await connectDB();
    }
    catch (err) {
        console.error("Database connection unavailable. Continuing without DB-backed routes:", err);
    }
    httpServer.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
};
startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
