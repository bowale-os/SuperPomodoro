const express = require('express');
const Session = require('../models/Session');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // You'd add logic to compute stats for req.session.userId
    // For example, how many sessions, total minutes, etc.
    res.json({ /* your stats object here */ });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
