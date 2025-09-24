const express = require('express');
const router = express.Router();

const suggestions = [
  "Look out the window for 30 seconds and relax your eyes.",
  "Stand up and walk around the room.",
  "Try a quick neck stretch.",
  "Drink a glass of water and take a deep breath."
];

router.get('/', (req, res) => {
  const randomIdx = Math.floor(Math.random() * suggestions.length);
  res.json({ suggestion: suggestions[randomIdx] });
});

module.exports = router;
