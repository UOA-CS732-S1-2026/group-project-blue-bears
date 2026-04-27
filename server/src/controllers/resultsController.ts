import { Request, Response } from 'express';

const { getUserMatchHistory } = require('../../data-access/profileHistoryDataAccess');

export const getResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;

        const results = await getUserMatchHistory(req.user!.userId, page, limit);

        res.status(200).json(results);
    } catch (error) {
        console.error('Results error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
