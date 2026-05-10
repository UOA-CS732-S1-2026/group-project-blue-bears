"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_1 = require("../middleware/authenticate");
const profileController_1 = require("../controllers/profileController");
const resultsController_1 = require("../controllers/resultsController");
const leaderboardController_1 = require("../controllers/leaderboardController");
const router = express_1.default.Router();
router.use(authenticate_1.authenticate);
router.get('/profile', profileController_1.getProfile);
router.get('/results', resultsController_1.getResults);
router.get('/leaderboard', leaderboardController_1.getLeaderboardData);
exports.default = router;
