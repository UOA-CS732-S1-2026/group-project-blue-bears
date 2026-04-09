const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
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
        // Cached stats for quick reads and leaderboard usage.
        stats: {
            matchesPlayed: { type: Number, default: 0 },
            matchesWon: { type: Number, default: 0 },
            bestWpm: { type: Number, default: 0 },
            avgWpm: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
