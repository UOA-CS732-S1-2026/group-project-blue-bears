import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    createdAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }
);

export const User = mongoose.model<IUser>('User', userSchema);