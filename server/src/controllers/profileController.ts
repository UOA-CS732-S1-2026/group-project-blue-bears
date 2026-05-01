import { Request, Response } from 'express';

const { getUserProfileSummary } = require('../../data-access/profileHistoryDataAccess');

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const profile = await getUserProfileSummary(req.user!.userId);

        if (!profile) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json(profile);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
