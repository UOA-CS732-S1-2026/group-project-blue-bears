const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        const error = new Error('MONGO_URI is not set in environment variables');
        console.error(error.message);
        throw error;
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
};

module.exports = connectDB;
