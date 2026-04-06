import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRegister = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('username').isLength({ min: 4 }).withMessage('Username must be at least 4 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const validateLogin = [
    body('emailOrUsername').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};