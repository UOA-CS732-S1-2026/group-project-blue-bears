const mongoose = require('mongoose');
const { User } = require('../src/models/User');
const { Match } = require('../src/models/Match');

const buildUserMatchQuery = (objectId) => ({
    $or: [
        { 'player1.userId': objectId },
        { 'player2.userId': objectId },
    ],
});

// Returns profile summary using User document + real-time Match aggregation.
// User.stats is not maintained in this layer.
const getUserProfileSummary = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    const user = await User.findById(objectId).select('username email').lean();
    if (!user) {
        return null;
    }

    const [summary] = await Match.aggregate([
        { $match: buildUserMatchQuery(objectId) },
        {
            $project: {
                isWin: {
                    $cond: [{ $eq: ['$winnerId', objectId] }, 1, 0],
                },
                userWpm: {
                    $cond: [
                        { $eq: ['$player1.userId', objectId] },
                        '$player1.wpm',
                        '$player2.wpm',
                    ],
                },
            },
        },
        {
            $group: {
                _id: null,
                totalMatches: { $sum: 1 },
                totalWins: { $sum: '$isWin' },
                bestWpm: { $max: '$userWpm' },
            },
        },
    ]);

    return {
        username: user.username,
        email: user.email,
        totalMatches: summary ? summary.totalMatches : 0,
        totalWins: summary ? summary.totalWins : 0,
        bestWpm: summary ? summary.bestWpm : 0,
    };
};

// Returns paginated match history where user is player1 or player2, newest first.
const getUserMatchHistory = async (userId, page = 1, limit = 10) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            matches: [],
        };
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const skip = (safePage - 1) * safeLimit;
    const query = buildUserMatchQuery(objectId);

    const [total, matches] = await Promise.all([
        Match.countDocuments(query),
        Match.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
    ]);

    return {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
        matches,
    };
};

module.exports = {
    getUserProfileSummary,
    getUserMatchHistory,
};
