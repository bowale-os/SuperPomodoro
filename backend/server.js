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
    origin: [
        `http://localhost:${PORT}`, // Development
        'https://superpomodoro.onrender.com' // Production Netlify domain
    ],
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
// Serve everything inside "frontend/public" at root URL ("/")
app.use(express.static(path.join(__dirname, '../frontend/public')));
connectDB();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/html/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/html/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/html/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/html/dashboard.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/html/profile.html'));
});

app.get('/stats', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/html/stats.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Visit http://localhost:${PORT} to view the application`);
  }
});
