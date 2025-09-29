const express = require('express');
const Session = require('../models/Session');
const router = express.Router();

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get all completed sessions for the user
    const completedSessions = await Session.find({ 
      userId: userId,
      status: 'completed'
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const totalSessions = completedSessions.length;
    const totalStudyMinutes = completedSessions.reduce((sum, session) => 
      sum + (session.studyMins * session.numCycles), 0);
    const totalBreakMinutes = completedSessions.reduce((sum, session) => 
      sum + (session.breakMins * (session.numCycles - 1)) + (session.longBreakMins || 0), 0);
    const totalMinutes = totalStudyMinutes + totalBreakMinutes;
    
    // Calculate average session length
    const avgSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    
    // Get sessions from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = completedSessions.filter(session => 
      new Date(session.createdAt) >= sevenDaysAgo
    );
    
    // Get sessions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlySessions = completedSessions.filter(session => 
      new Date(session.createdAt) >= thirtyDaysAgo
    );

    // Calculate daily averages
    const dailyAverage = recentSessions.length > 0 ? 
      Math.round(totalStudyMinutes / 7) : 0;
    
    const monthlyAverage = monthlySessions.length > 0 ? 
      Math.round(totalStudyMinutes / 30) : 0;

    // Get most productive day (by study minutes)
    const dailyStats = {};
    completedSessions.forEach(session => {
      const date = new Date(session.createdAt).toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = { studyMinutes: 0, sessions: 0 };
      }
      dailyStats[date].studyMinutes += session.studyMins * session.numCycles;
      dailyStats[date].sessions += 1;
    });

    const mostProductiveDay = Object.entries(dailyStats)
      .sort(([,a], [,b]) => b.studyMinutes - a.studyMinutes)[0];

    const stats = {
      totalSessions,
      totalStudyMinutes,
      totalBreakMinutes,
      totalMinutes,
      avgSessionLength,
      dailyAverage,
      monthlyAverage,
      recentSessions: recentSessions.length,
      monthlySessions: monthlySessions.length,
      mostProductiveDay: mostProductiveDay ? {
        date: mostProductiveDay[0],
        studyMinutes: mostProductiveDay[1].studyMinutes,
        sessions: mostProductiveDay[1].sessions
      } : null,
      recentSessionsList: recentSessions.slice(0, 10).map(session => ({
        id: session._id,
        name: session.sessionName,
        studyMinutes: session.studyMins * session.numCycles,
        breakMinutes: session.breakMins * (session.numCycles - 1) + (session.longBreakMins || 0),
        cycles: session.numCycles,
        date: session.createdAt
      }))
    };

    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
