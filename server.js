const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./utils/dbConnection.js');

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();    

// Import routes
const userRoutes = require('./routes/userRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userProgressRoutes = require('./routes/photosRouter'); // Updated photos router
const workoutHistoryRoutes =  require("./routes/workoutHistoryRoutes");
const bodyMeasurementRoutes = require('./routes/bodyMeasurementRoutes');
const harshitPlanRoutes = require('./routes/HarshitPlanRoutes');
const planExerciseProgressRoutes = require('./routes/PlanExerciseProgressRoutes');
const notificationRoutes = require('./routes/NotificationRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static serving - IMPORTANT: Add this before routes
app.use('/exercises', express.static(path.join(__dirname, 'public/exercises')));
app.use('/profileimg', express.static(path.join(__dirname, 'public/profileimg')));
app.use('/usersprogress', express.static(path.join(__dirname, 'public/usersprogress'))); // User progress photos

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/userprogress', userProgressRoutes);
app.use("/api/workout-history",workoutHistoryRoutes ); // User progress routes
app.use("/api/body-measurements", bodyMeasurementRoutes); // Body measurement routes
app.use('/api/harshit', harshitPlanRoutes);
app.use('/api/plan-progress', planExerciseProgressRoutes); // Plan exercise progress routes
// app.use('/api/notifications', notificationRoutes); // Notification routes

// Fallback to index.html for SPA routes
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
});

// Graceful Shutdown
const shutdown = () => {
  console.log('🔄 Shutting down server...');
  server.close(() => {
    console.log('✅ HTTP server closed.');
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      console.log('🔌 MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;