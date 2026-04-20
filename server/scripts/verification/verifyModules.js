require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');

const connectDB = require('../../config/db');
const User = require('../../models/User');
const Match = require('../../models/Match');
const {
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById,
} = require('../../data-access/userDataAccess');
const {
    createMatchResult,
    getMatchesByUserId,
    getRecentMatches,
} = require('../../data-access/matchDataAccess');
const {
    getUserProfileSummary,
    getUserMatchHistory,
} = require('../../data-access/profileHistoryDataAccess');
const { getLeaderboard } = require('../../data-access/leaderboardDataAccess');

const execFileAsync = promisify(execFile);
const VERIFY_TAG = 'VERIFY08';
const USER_PREFIX = 'verify08_';
const EMAIL_DOMAIN = 'verify08.local';

const userFilter = {
    $or: [
        { username: new RegExp(`^${USER_PREFIX}`) },
        { email: new RegExp(`@${EMAIL_DOMAIN}$`) },
    ],
};

const matchFilter = {
    $or: [
        { passage: new RegExp(`^\\[${VERIFY_TAG}\\]`) },
        { 'player1.username': new RegExp(`^${USER_PREFIX}`) },
        { 'player2.username': new RegExp(`^${USER_PREFIX}`) },
    ],
};

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeSeedDbUri = (baseUri, dbName) => {
    const [withoutQuery, query] = baseUri.split('?');
    const protocolIndex = withoutQuery.indexOf('://');

    if (protocolIndex < 0) {
        throw new Error('Invalid MONGO_URI format for isolated seed verification');
    }

    const slashAfterHost = withoutQuery.indexOf('/', protocolIndex + 3);
    const root = slashAfterHost >= 0
        ? withoutQuery.slice(0, slashAfterHost + 1)
        : `${withoutQuery}/`;

    return query ? `${root}${dbName}?${query}` : `${root}${dbName}`;
};

const runSeedVerification = async (baseUri) => {
    const seedDbName = `verify08_seed_${Date.now()}`;
    const seedUri = makeSeedDbUri(baseUri, seedDbName);
    const serverRoot = path.resolve(__dirname, '../..');

    const { stdout, stderr } = await execFileAsync('node', ['scripts/seed.js'], {
        cwd: serverRoot,
        env: {
            ...process.env,
            MONGO_URI: seedUri,
        },
        timeout: 120000,
    });

    const seedConn = await mongoose.createConnection(seedUri).asPromise();

    try {
        const userCount = await seedConn.collection('users').countDocuments();
        const matchCount = await seedConn.collection('matches').countDocuments();

        assert(userCount >= 3, 'seed verification failed: expected at least 3 users');
        assert(matchCount >= 3, 'seed verification failed: expected at least 3 matches');

        await seedConn.dropDatabase();

        return {
            status: 'passed',
            details: {
                isolatedDbName: seedDbName,
                userCount,
                matchCount,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
            },
        };
    } finally {
        await seedConn.close();
    }
};

const run = async () => {
    const results = {
        dbConnection: { status: 'not-run' },
        userModel: { status: 'not-run' },
        matchModel: { status: 'not-run' },
        userDataAccess: { status: 'not-run' },
        matchDataAccess: { status: 'not-run' },
        profileHistoryDataAccess: { status: 'not-run' },
        leaderboardDataAccess: { status: 'not-run' },
        seedScript: { status: 'not-run' },
        cleanup: { status: 'not-run' },
    };

    let verificationUsers = {};

    try {
        await connectDB();
        assert(mongoose.connection.readyState === 1, 'mongoose connection is not open');
        results.dbConnection = { status: 'passed', details: 'connected and readyState=1' };

        // Pre-clean only verification-tagged data.
        await Match.deleteMany(matchFilter);
        await User.deleteMany(userFilter);

        const stamp = Date.now();

        // User model verification
        const modelUser = await User.create({
            username: `${USER_PREFIX}model_${stamp}`,
            email: `${USER_PREFIX}model_${stamp}@${EMAIL_DOMAIN}`,
            passwordHash: 'hash-model',
        });
        assert(modelUser.stats && modelUser.stats.matchesPlayed === 0, 'User model stats defaults missing');
        results.userModel = { status: 'passed', details: 'User.create works and stats defaults are present' };

        // userDataAccess verification
        const userA = await createUser({
            username: `${USER_PREFIX}a_${stamp}`,
            email: `${USER_PREFIX}a_${stamp}@${EMAIL_DOMAIN}`,
            passwordHash: 'hash-a',
        });
        const userB = await createUser({
            username: `${USER_PREFIX}b_${stamp}`,
            email: `${USER_PREFIX}b_${stamp}@${EMAIL_DOMAIN}`,
            passwordHash: 'hash-b',
        });
        const userC = await createUser({
            username: `${USER_PREFIX}c_${stamp}`,
            email: `${USER_PREFIX}c_${stamp}@${EMAIL_DOMAIN}`,
            passwordHash: 'hash-c',
        });

        const byEmail = await findUserByEmail(userA.email);
        const byUsername = await findUserByUsername(userB.username);
        const byId = await findUserById(userC._id);

        assert(byEmail && byEmail.email === userA.email, 'findUserByEmail failed');
        assert(byUsername && byUsername.username === userB.username, 'findUserByUsername failed');
        assert(byId && String(byId._id) === String(userC._id), 'findUserById failed');
        assert(userA.stats && userA.stats.bestWpm === 0, 'createUser broke stats default structure');

        results.userDataAccess = {
            status: 'passed',
            details: 'createUser/findByEmail/findByUsername/findById all passed',
        };

        verificationUsers = { modelUser, userA, userB, userC };

        // Match model verification
        const modelMatch = await Match.create({
            passage: `[${VERIFY_TAG}] model-match-${stamp}`,
            winnerId: modelUser._id,
            player1: {
                userId: modelUser._id,
                username: modelUser.username,
                wpm: 55,
                accuracy: 92,
            },
            player2: {
                userId: userA._id,
                username: userA.username,
                wpm: 40,
                accuracy: 88,
            },
        });

        assert(modelMatch.player1 && modelMatch.player2, 'Match model missing player1/player2');
        assert(!Object.prototype.hasOwnProperty.call(modelMatch.toObject(), 'participants'), 'Match model should not use participants');
        results.matchModel = { status: 'passed', details: 'Match.create works with fixed 1v1 structure' };

        // matchDataAccess verification
        await delay(10);
        await createMatchResult({
            passage: `[${VERIFY_TAG}] data-match-1-${stamp}`,
            winnerId: userA._id,
            player1: {
                userId: userA._id,
                username: userA.username,
                wpm: 95,
                accuracy: 99,
            },
            player2: {
                userId: userB._id,
                username: userB.username,
                wpm: 80,
                accuracy: 96,
            },
        });

        await delay(10);
        await createMatchResult({
            passage: `[${VERIFY_TAG}] data-match-2-${stamp}`,
            winnerId: userB._id,
            player1: {
                userId: userB._id,
                username: userB.username,
                wpm: 88,
                accuracy: 97,
            },
            player2: {
                userId: userA._id,
                username: userA.username,
                wpm: 84,
                accuracy: 95,
            },
        });

        await delay(10);
        await createMatchResult({
            passage: `[${VERIFY_TAG}] data-match-3-${stamp}`,
            winnerId: userC._id,
            player1: {
                userId: userC._id,
                username: userC.username,
                wpm: 77,
                accuracy: 93,
            },
            player2: {
                userId: userA._id,
                username: userA.username,
                wpm: 70,
                accuracy: 90,
            },
        });

        const matchesForA = await getMatchesByUserId(userA._id, { limit: 20, skip: 0 });
        const recentMatches = await getRecentMatches(4);

        assert(matchesForA.length >= 4, 'getMatchesByUserId returned too few records');
        assert(matchesForA.some((m) => String(m.player1.userId) === String(userA._id)), 'player1.userId path not matched');
        assert(matchesForA.some((m) => String(m.player2.userId) === String(userA._id)), 'player2.userId path not matched');

        for (let i = 1; i < matchesForA.length; i += 1) {
            assert(
                new Date(matchesForA[i - 1].createdAt).getTime() >= new Date(matchesForA[i].createdAt).getTime(),
                'getMatchesByUserId is not sorted by createdAt desc'
            );
        }

        for (let i = 1; i < recentMatches.length; i += 1) {
            assert(
                new Date(recentMatches[i - 1].createdAt).getTime() >= new Date(recentMatches[i].createdAt).getTime(),
                'getRecentMatches is not sorted by createdAt desc'
            );
        }

        results.matchDataAccess = {
            status: 'passed',
            details: 'createMatchResult/getMatchesByUserId/getRecentMatches passed with correct paths and sorting',
        };

        // profileHistoryDataAccess verification
        const summaryA = await getUserProfileSummary(userA._id);
        const historyA = await getUserMatchHistory(userA._id, 1, 2);

        assert(summaryA, 'getUserProfileSummary returned null');
        assert(typeof summaryA.username === 'string', 'summary.username missing');
        assert(typeof summaryA.email === 'string', 'summary.email missing');
        assert(typeof summaryA.totalMatches === 'number', 'summary.totalMatches missing');
        assert(typeof summaryA.totalWins === 'number', 'summary.totalWins missing');
        assert(typeof summaryA.bestWpm === 'number', 'summary.bestWpm missing');
        assert(summaryA.totalMatches >= 4, 'summary totalMatches incorrect');
        assert(summaryA.bestWpm === 95, 'summary bestWpm should be calculated from Match docs');
        assert(summaryA.bestWpm !== userA.stats.bestWpm, 'summary appears to rely on User.stats cache');

        assert(historyA && Array.isArray(historyA.matches), 'history.matches missing');
        assert(historyA.page === 1, 'history.page incorrect');
        assert(historyA.limit === 2, 'history.limit incorrect');
        assert(typeof historyA.total === 'number', 'history.total missing');
        assert(typeof historyA.totalPages === 'number', 'history.totalPages missing');

        for (let i = 1; i < historyA.matches.length; i += 1) {
            assert(
                new Date(historyA.matches[i - 1].createdAt).getTime() >= new Date(historyA.matches[i].createdAt).getTime(),
                'history matches are not sorted by createdAt desc'
            );
        }

        results.profileHistoryDataAccess = {
            status: 'passed',
            details: 'profile summary fields and paginated history structure verified',
        };

        // leaderboardDataAccess verification
        const leaderboard = await getLeaderboard(10);
        assert(Array.isArray(leaderboard), 'leaderboard is not an array');
        assert(leaderboard.length > 0, 'leaderboard is empty');

        leaderboard.forEach((row) => {
            assert(Object.prototype.hasOwnProperty.call(row, 'userId'), 'leaderboard.userId missing');
            assert(Object.prototype.hasOwnProperty.call(row, 'username'), 'leaderboard.username missing');
            assert(Object.prototype.hasOwnProperty.call(row, 'bestWpm'), 'leaderboard.bestWpm missing');
            assert(Object.prototype.hasOwnProperty.call(row, 'totalMatches'), 'leaderboard.totalMatches missing');
        });

        for (let i = 1; i < leaderboard.length; i += 1) {
            assert(leaderboard[i - 1].bestWpm >= leaderboard[i].bestWpm, 'leaderboard is not sorted by bestWpm desc');
        }

        results.leaderboardDataAccess = {
            status: 'passed',
            details: 'leaderboard fields and bestWpm descending order verified',
        };

        // seed script verification in isolated DB (safe for development DB)
        results.seedScript = await runSeedVerification(process.env.MONGO_URI);
    } catch (err) {
        const failedModule = Object.entries(results).find(([, value]) => value.status === 'not-run');
        const moduleName = failedModule ? failedModule[0] : 'unknown';
        results[moduleName] = { status: 'failed', details: err.message };
        throw Object.assign(err, { verificationResults: results });
    } finally {
        try {
            await Match.deleteMany(matchFilter);
            await User.deleteMany(userFilter);
            results.cleanup = {
                status: 'passed',
                details: 'verification-tagged users and matches removed',
            };
        } catch (cleanupErr) {
            results.cleanup = { status: 'failed', details: cleanupErr.message };
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // eslint-disable-next-line no-console
        console.log(JSON.stringify(results, null, 2));
    }
};

run().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Module verification failed:', err.message);
    process.exit(1);
});
