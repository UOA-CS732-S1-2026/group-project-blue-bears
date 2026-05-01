// Usage: node seed-matches.js <userId>
// Gets userId from browser console: localStorage.getItem('userId')

require('dotenv').config();
const mongoose = require('mongoose');

const PlayerSnapshotSchema = new mongoose.Schema(
    { userId: mongoose.Schema.Types.ObjectId, username: String, wpm: Number, accuracy: Number },
    { _id: false }
);
const MatchSchema = new mongoose.Schema(
    { passage: String, winnerId: mongoose.Schema.Types.ObjectId, player1: PlayerSnapshotSchema, player2: PlayerSnapshotSchema },
    { timestamps: true }
);
const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

const userId = process.argv[2];

if (!userId) {
    console.error('Usage: node seed-matches.js <userId>');
    console.error('Get your userId from the browser console: localStorage.getItem(\'userId\')');
    process.exit(1);
}

const opponents = [
    { id: new mongoose.Types.ObjectId(), name: 'MARK' },
    { id: new mongoose.Types.ObjectId(), name: 'SARA' },
    { id: new mongoose.Types.ObjectId(), name: 'JAKE' },
    { id: new mongoose.Types.ObjectId(), name: 'LUNA' },
    { id: new mongoose.Types.ObjectId(), name: 'REX' },
];

const passage = 'the quick brown fox jumps over the lazy dog';

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const uid = new mongoose.Types.ObjectId(userId);

    const matches = [
        // wins
        { isWin: true,  opponentIdx: 0, myWpm: 78, myAcc: 96, oppWpm: 65, oppAcc: 91, daysAgo: 0 },
        { isWin: true,  opponentIdx: 1, myWpm: 82, myAcc: 98, oppWpm: 70, oppAcc: 93, daysAgo: 1 },
        { isWin: false, opponentIdx: 0, myWpm: 65, myAcc: 91, oppWpm: 78, oppAcc: 96, daysAgo: 1 },
        { isWin: true,  opponentIdx: 2, myWpm: 74, myAcc: 95, oppWpm: 60, oppAcc: 88, daysAgo: 3 },
        { isWin: false, opponentIdx: 3, myWpm: 68, myAcc: 92, oppWpm: 80, oppAcc: 97, daysAgo: 4 },
        { isWin: true,  opponentIdx: 4, myWpm: 90, myAcc: 99, oppWpm: 75, oppAcc: 94, daysAgo: 5 },
        { isWin: false, opponentIdx: 1, myWpm: 61, myAcc: 89, oppWpm: 77, oppAcc: 95, daysAgo: 6 },
        { isWin: true,  opponentIdx: 2, myWpm: 85, myAcc: 97, oppWpm: 72, oppAcc: 92, daysAgo: 8 },
    ];

    const docs = matches.map(({ isWin, opponentIdx, myWpm, myAcc, oppWpm, oppAcc, daysAgo: ago }) => {
        const opp = opponents[opponentIdx];
        const player1 = { userId: uid,  username: 'YOU', wpm: myWpm,  accuracy: myAcc };
        const player2 = { userId: opp.id, username: opp.name, wpm: oppWpm, accuracy: oppAcc };
        return {
            passage,
            winnerId: isWin ? uid : opp.id,
            player1,
            player2,
            createdAt: daysAgo(ago),
            updatedAt: daysAgo(ago),
        };
    });

    await Match.insertMany(docs);
    console.log(`Inserted ${docs.length} matches for userId: ${userId}`);
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
