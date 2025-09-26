# SuperPomodoro

A Pomodoro timer application with session management and progress tracking.

## Features

- 🍅 Customizable Pomodoro timer (work/break durations)
- 🔄 Multiple study cycles with long breaks
- 📊 Session history and progress tracking
- 👤 User profiles and preferences
- 💡 Break activity suggestions
- 📱 Responsive design

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET_KEY=your_session_secret_key
   PORT=5000
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Visit `http://localhost:5000` to view the application.

## Deployment on Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following environment variables in Render:
   - `MONGODB_URI`: Your MongoDB connection string
   - `SESSION_SECRET_KEY`: A secure random string for session encryption
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or let Render assign automatically)

4. Deploy! Render will automatically build and deploy your application.

## Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── server.js        # Main server file
├── frontend/
│   └── public/          # Static files and HTML pages
├── package.json         # Dependencies and scripts
└── render.yaml          # Render deployment configuration
```

## API Endpoints

- `GET /api/sessions` - Get user's session history
- `POST /api/sessions` - Create a new session
- `PATCH /api/sessions/:id/start` - Start a session
- `PATCH /api/sessions/:id/complete` - Complete a session
- `PATCH /api/sessions/:id/cancel` - Cancel a session
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update user profile
- `GET /api/breakideas` - Get break activity suggestions

## Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Express Sessions
- **Deployment**: Render
