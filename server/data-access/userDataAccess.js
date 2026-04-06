const User = require('../models/User');

// Creates a user document. stats uses schema defaults and is not maintained here.
const createUser = (data) => User.create(data);

// Finds one user by email.
const findUserByEmail = (email) => User.findOne({ email }).lean();

// Finds one user by username.
const findUserByUsername = (username) => User.findOne({ username }).lean();

// Finds one user by MongoDB ObjectId.
const findUserById = (id) => User.findById(id).lean();

module.exports = {
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById,
};
