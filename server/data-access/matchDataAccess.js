const Match = require('../models/Match');

// Creates a new Match document. Caller is responsible for winnerId and player snapshots.
const createMatchResult = (matchData) => Match.create(matchData);

// Returns all matches where the user participated as player1 or player2.
// Sorted newest first. Accepts optional { limit, skip } for basic pagination.
const getMatchesByUserId = (userId, options = {}) => {
    const { limit = 20, skip = 0 } = options;
    return Match.find({
        $or: [
            { 'player1.userId': userId },
            { 'player2.userId': userId },
        ],
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
};

// Returns the most recent matches across all users, newest first.
const getRecentMatches = (limit = 10) =>
    Match.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

module.exports = {
    createMatchResult,
    getMatchesByUserId,
    getRecentMatches,
};
