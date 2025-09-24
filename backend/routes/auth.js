const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

//User Registration
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Hash password for security
        const hashedPassword = await bcrypt.hash(password, 10);
        // create user in mongodb
        const user = await User.create({ email, password: hashedPassword });
        res.status(201).json({ message: 'Registered!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//Login
router.post('/login', async (req, res) => {
    try {
        const { inputEmail, inputPassword } = req.body;

        //verify email and passsword
        //find user is exists
        const user = await User.findOne({ email: inputEmail });
        if (!user) {
            return res.status(400).json({ error: 'User does not exist' });
        }

        //compare password and stored hash
        const isMatch = await bcrypt.compare(inputPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        //authentication succeeds
        //create jwt token
        req.session.userId = user._id;
        res.json({ message: 'Login was successful!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;