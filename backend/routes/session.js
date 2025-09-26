const express = require('express');
const session = require('../models/Session');
const Session = require('../models/Session');
const router = express.Router();

//Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

//POST - api/sessions - Create a new session

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { sessionName, studyMins, breakMins, numCycles, shouldRepeat, longBreakMins} = req.body;
        const newSession = await Session.create({
            userId: req.session.userId,
            sessionName, studyMins, breakMins, numCycles, shouldRepeat, longBreakMins
        });
        res.status(201).json(newSession);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//GET - api/sessions - Get all completed or cancelled sessions for a user
router.get('/', isAuthenticated, async(req, res) => {
    try {
        const sessions = await Session.find({ 
            userId: req.session.userId,
            status: { $in: ['completed', 'cancelled'] }
        }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//PATCH change the status of a session to active
router.patch('/:id/start', isAuthenticated, async (req, res) => {
    try {
        const session = await Session.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { status: 'active' }, // or your field (e.g., isStarted, etc.)
            { new: true }
        );
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//PATCH change the status of a session to cancelled
router.patch('/:id/cancel', isAuthenticated, async (req, res) => {
    try {
        const session = await Session.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { status: 'cancelled' }, // or your field (e.g., isStarted, etc.)
            { new: true }
        );
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//PATCH change the status of a session to completed
router.patch('/:id/complete', isAuthenticated, async (req, res) => {
    try {
        const session = await Session.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { status: 'completed' }, // or your field (e.g., isStarted, etc.)
            { new: true }
        );
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//DELETE - api/sessions/:id - Delete a session
router.delete('/:id', isAuthenticated, async(req, res) => {
    try {
        const session = await Session.findOneAndDelete({ 
            _id: req.params.id,
            userId: req.session.userId
        });
        if (!session){
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ message: 'Session deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
