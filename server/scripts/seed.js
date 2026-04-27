require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('ts-node/register/transpile-only');

const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const { User } = require('../src/models/User');
const { Match } = require('../src/models/Match');

const run = async () => {
    // Production safety guard: block accidental execution against production database.
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_SEED !== 'true') {
        console.error('Seed blocked: NODE_ENV is "production". Set ALLOW_DB_SEED=true to allow.');
        process.exit(1);
    }

    await connectDB();

    // Clear only the collections managed by this seed
    await User.deleteMany({});
    await Match.deleteMany({});
    console.log('Cleared User and Match collections');

    // Insert 3 sample users. stats relies on schema defaults.
    // alice: custom firstName, lastName, and custom profileImageUrl
    // bob: firstName and lastName only, no profileImageUrl (will use schema default)
    // carol: custom profileImageUrl, no firstName/lastName
    const passwordHash = await bcrypt.hash('TestPassword1!', 10);

    const [alice, bob, carol] = await User.insertMany([
        {
            username: 'alice',
            email: 'alice@example.com',
            passwordHash,
            firstName: 'Alice',
            lastName: 'Smith',
            profileImageUrl: 'https://placehold.co/150x150/4f86c6/ffffff?text=AS',
        },
        {
            username: 'bob',
            email: 'bob@example.com',
            passwordHash,
            firstName: 'Bob',
            lastName: 'Jones',
            // profileImageUrl omitted intentionally — schema default will be applied
        },
        {
            username: 'carol',
            email: 'carol@example.com',
            passwordHash,
            profileImageUrl: 'https://placehold.co/150x150/e05c5c/ffffff?text=C',
        },
    ]);
    console.log(`Inserted 3 users: alice (${alice._id}), bob (${bob._id}), carol (${carol._id})`);

    // Insert sample matches using fixed player1 / player2 / winnerId structure
    const matches = await Match.insertMany([
        {
            passage: 'The quick brown fox jumps over the lazy dog.',
            winnerId: alice._id,
            player1: { userId: alice._id, username: 'alice', wpm: 85, accuracy: 97 },
            player2: { userId: bob._id, username: 'bob', wpm: 72, accuracy: 94 },
        },
        {
            passage: 'To be or not to be, that is the question.',
            winnerId: bob._id,
            player1: { userId: bob._id, username: 'bob', wpm: 80, accuracy: 96 },
            player2: { userId: carol._id, username: 'carol', wpm: 75, accuracy: 93 },
        },
        {
            passage: 'All that glitters is not gold.',
            winnerId: carol._id,
            player1: { userId: carol._id, username: 'carol', wpm: 91, accuracy: 99 },
            player2: { userId: alice._id, username: 'alice', wpm: 88, accuracy: 98 },
        },
        {
            passage: 'In the beginning was the Word.',
            winnerId: alice._id,
            player1: { userId: alice._id, username: 'alice', wpm: 90, accuracy: 98 },
            player2: { userId: carol._id, username: 'carol', wpm: 83, accuracy: 95 },
        },
    ]);
    console.log(`Inserted ${matches.length} matches`);

    console.log('Seed complete');
    process.exit(0);
};

run().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
