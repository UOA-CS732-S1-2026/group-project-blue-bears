import { Request, Response } from 'express';

const { getLeaderboard } = require('../../data-access/leaderboardDataAccess');

export const getLeaderboardData = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 10;

        const leaderboard = await getLeaderboard(limit);

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
