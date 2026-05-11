import mongoose, { Document, Schema, ObjectId } from 'mongoose';

interface IPlayerSnapshot {
    userId?: ObjectId | null;
    username: string;
    wpm: number;
    accuracy: number;
}

const PlayerSnapshotSchema = new Schema<IPlayerSnapshot>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
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

interface IMatch extends Document {
    passage: string;
    winnerId?: ObjectId;
    player1: IPlayerSnapshot;
    player2: IPlayerSnapshot;
    createdAt: Date;
    updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
    {
        passage: {
            type: String,
            required: true,
        },
        winnerId: {
            type: Schema.Types.ObjectId,
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

const Match = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export { Match };
