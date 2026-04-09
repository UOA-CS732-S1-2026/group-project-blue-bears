const mongoose = require('mongoose');

const PlayerSnapshotSchema = new mongoose.Schema(
    {
        // ObjectId reference to User
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Snapshot username captured at match time
        username: {
            type: String,
            required: true,
        },
        wpm: {
            type: Number,
            required: true,
        },
        accuracy: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const MatchSchema = new mongoose.Schema(
    {
        passage: {
            type: String,
            required: true,
        },
        // ObjectId reference to User for quick winner lookup
        winnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        player1: {
            type: PlayerSnapshotSchema,
            required: true,
        },
        player2: {
            type: PlayerSnapshotSchema,
            required: true,
        },
    },
    { timestamps: true }
);

MatchSchema.index({ winnerId: 1 });
MatchSchema.index({ 'player1.userId': 1 });
MatchSchema.index({ 'player2.userId': 1 });
MatchSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Match || mongoose.model('Match', MatchSchema);
