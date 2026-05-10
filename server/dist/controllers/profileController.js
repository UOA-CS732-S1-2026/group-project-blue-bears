"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = void 0;
const { getUserProfileSummary } = require('../../data-access/profileHistoryDataAccess');
const getProfile = async (req, res) => {
    try {
        const profile = await getUserProfileSummary(req.user.userId);
        if (!profile) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.status(200).json(profile);
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProfile = getProfile;
