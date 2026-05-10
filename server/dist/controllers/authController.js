"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const register = async (req, res) => {
    try {
        const { email, username, firstName, lastName, password } = req.body;
        // Check if user exists
        const existingUser = await User_1.User.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            return res.status(409).json({ error: 'Email or username already in use' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const newUser = new User_1.User({
            email,
            username,
            firstName,
            lastName,
            passwordHash,
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        // Find user by email OR username
        const user = await User_1.User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email/username or password' });
        }
        // Verify password matches hash
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email/username or password' });
        }
        // Generate JWT token (24-hour expiration)
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token, userId: user._id, email: user.email, username: user.username });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
