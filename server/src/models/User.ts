import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    stats: {
        matchesPlayed: number;
        matchesWon: number;
        bestWpm: number;
        avgWpm: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        stats: {
            matchesPlayed: { type: Number, default: 0 },
            matchesWon: { type: Number, default: 0 },
            bestWpm: { type: Number, default: 0 },
            avgWpm: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export { User };
