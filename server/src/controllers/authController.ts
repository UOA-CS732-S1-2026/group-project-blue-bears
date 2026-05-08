import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, username, firstName, lastName, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Email or username already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            username,
            firstName,
            lastName,
            passwordHash,
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { emailOrUsername, password } = req.body;

        // Find user by email OR username
        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email/username or password' });
        }

        // Verify password matches hash
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email/username or password' });
        }

        // Generate JWT token (24-hour expiration)
        const token = jwt.sign(
            { userId: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        res.status(200).json({ token, userId: user._id, email: user.email, username: user.username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};