const express = require('express');
const router = express.Router();
const { getTodayIST, getCurrentYearIST } = require('../utils/dateHelper');

/**
 * GET /api/assistant-config
 * Returns the system prompt with today's date injected.
 * Use this in Vapi as a dynamic variable or as a reference.
 */
router.get('/assistant-config', (req, res) => {
  const today = getTodayIST();
  const year = getCurrentYearIST();

  res.json({
    success: true,
    today: today,
    year: year,
    message: `Today is ${today}. Use this date as reference for all appointments.`
  });
});

module.exports = router;