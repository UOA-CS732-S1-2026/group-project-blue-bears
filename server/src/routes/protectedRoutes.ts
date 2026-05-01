import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { getProfile } from '../controllers/profileController';
import { getResults } from '../controllers/resultsController';
import { getLeaderboardData } from '../controllers/leaderboardController';

const router = express.Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.get('/results', getResults);
router.get('/leaderboard', getLeaderboardData);

export default router;
