"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResults = void 0;
const { getUserMatchHistory } = require('../../data-access/profileHistoryDataAccess');
const getResults = async (req, res) => {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const results = await getUserMatchHistory(req.user.userId, page, limit);
        res.status(200).json(results);
    }
    catch (error) {
        console.error('Results error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getResults = getResults;
