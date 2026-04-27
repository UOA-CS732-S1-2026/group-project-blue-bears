import mongoose, { Document, Schema } from 'mongoose';

const DEFAULT_PROFILE_IMAGE_URL = 'https://placehold.co/150x150/cccccc/666666?text=User';

interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl: string;
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
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        profileImageUrl: {
            type: String,
            trim: true,
            default: DEFAULT_PROFILE_IMAGE_URL,
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
