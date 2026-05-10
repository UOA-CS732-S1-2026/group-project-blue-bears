"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboardData = void 0;
const { getLeaderboard } = require('../../data-access/leaderboardDataAccess');
const getLeaderboardData = async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const leaderboard = await getLeaderboard(limit);
        res.status(200).json(leaderboard);
    }
    catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLeaderboardData = getLeaderboardData;
