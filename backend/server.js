const express = require('express');
const connectDB = require('./config/db')
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const sessionRoutes = require('./routes/session');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const breakIdeasRoutes = require('./routes/breakIdeas');
const profileRoutes  = require('./routes/profile');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000

//Middleware
app.use(cors({
    origin: `http://localhost:${PORT}`, //frontend origin - same as server port
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET_KEY, 
    resave: false,
    saveUninitialized: false,
    cookie: { secure:false }
}));
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/breakideas', breakIdeasRoutes);
app.use('/api/profile', profileRoutes);

connectDB();


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/dashboard.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/profile.html'));
});

app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/stats.html'));
});




app.listen(PORT, () => console.log(`Server running on port ${PORT}`));