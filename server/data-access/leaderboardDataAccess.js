const { Match } = require('../src/models/Match');

// Leaderboard metric: each user's best single-match WPM.
// We expand fixed 1v1 structure (player1/player2) into per-user rows, then aggregate.
// User.stats is not used as source of truth in this query layer.
const getLeaderboard = async (limit = 10) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    return Match.aggregate([
        {
            $project: {
                createdAt: 1,
                winnerId: 1,
                players: [
                    {
                        userId: '$player1.userId',
                        username: '$player1.username',
                        wpm: '$player1.wpm',
                        accuracy: '$player1.accuracy',
                    },
                    {
                        userId: '$player2.userId',
                        username: '$player2.username',
                        wpm: '$player2.wpm',
                        accuracy: '$player2.accuracy',
                    },
                ],
            },
        },
        { $unwind: '$players' },
        { $sort: { createdAt: 1 } },
        {
            $group: {
                _id: '$players.userId',
                userId: { $first: '$players.userId' },
                username: { $last: '$players.username' },
                bestWpm: { $max: '$players.wpm' },
                avgWpm: { $avg: '$players.wpm' },
                avgAccuracy: { $avg: '$players.accuracy' },
                totalMatches: { $sum: 1 },
                totalWins: {
                    $sum: {
                        $cond: [{ $eq: ['$winnerId', '$players.userId'] }, 1, 0],
                    },
                },
            },
        },
        { $sort: { bestWpm: -1, totalMatches: -1 } },
        { $limit: safeLimit },
        {
            $project: {
                _id: 0,
                userId: 1,
                username: 1,
                bestWpm: 1,
                avgWpm: { $round: ['$avgWpm', 0] },
                avgAccuracy: { $round: ['$avgAccuracy', 0] },
                totalMatches: 1,
                totalWins: 1,
            },
        },
    ]);
};

module.exports = {
    getLeaderboard,
};
