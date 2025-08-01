require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

console.log('🚀 Starting Parking Space Management Backend Server...');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Parking Space Management API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Import and use routes
try {
  const authRoutes = require('./routes/auth');
  const contactRoutes = require('./routes/contact');
  const adminRoutes = require('./routes/admin');
  const parkingSpaceRoutes = require('./routes/parkingSpaces');
  const bookingRoutes = require('./routes/bookings');

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/parking-spaces', parkingSpaceRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/admin', adminRoutes);

  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.log('Server will continue without some routes...');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Database connection
const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/parking-management';

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000,
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log('📋 Available endpoints:');
      console.log(`   GET  http://localhost:${port}/`);
      console.log(`   GET  http://localhost:${port}/health`);
      console.log(`   POST http://localhost:${port}/api/auth/register`);
      console.log(`   POST http://localhost:${port}/api/auth/login`);
      console.log(`   GET  http://localhost:${port}/api/parking-spaces`);
      console.log(`   GET  http://localhost:${port}/api/bookings`);
      console.log(`   GET  http://localhost:${port}/api/admin/dashboard`);
      console.log('🎉 Backend server is ready for frontend integration!');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('🔄 Starting server without database connection...');
    
    // Start server anyway for development
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port} (without database)`);
      console.log('⚠️  Database connection failed - some features may not work');
    });
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  mongoose.connection.close(() => {
    console.log('📴 Database connection closed');
    process.exit(0);
  });
});
