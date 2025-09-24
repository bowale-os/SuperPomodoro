const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Middleware to check user is logged in:
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// GET /api/profile
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Find user by ID stored in session
    const user = await User.findById(req.session.userId).select('-password'); // Exclude password
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PUT /api/profile
router.put('/', isAuthenticated, async (req, res) => {
  try {
    const updates = req.body; // { displayName, goal, etc. }
    const user = await User.findByIdAndUpdate(
      req.session.userId,
      updates,
      { new: true, runValidators: true, select: '-password' }
    );
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


module.exports = router;
