const Match = require('../models/Match');

// Leaderboard metric: each user's best single-match WPM.
// We expand fixed 1v1 structure (player1/player2) into per-user rows, then aggregate.
// User.stats is not used as source of truth in this query layer.
const getLeaderboard = async (limit = 10) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    return Match.aggregate([
        {
            $project: {
                createdAt: 1,
                players: [
                    {
                        userId: '$player1.userId',
                        username: '$player1.username',
                        wpm: '$player1.wpm',
                    },
                    {
                        userId: '$player2.userId',
                        username: '$player2.username',
                        wpm: '$player2.wpm',
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
                totalMatches: { $sum: 1 },
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
                totalMatches: 1,
            },
        },
    ]);
};

module.exports = {
    getLeaderboard,
};
