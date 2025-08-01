const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const uri = process.env.ATLAS_URI;
if (!uri) {
  console.error('ATLAS_URI environment variable is not set');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB Atlas...');

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Atlas connection established successfully!');
  console.log('🎉 Database connected to:', mongoose.connection.name);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Simple test routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Health check passed',
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      name: mongoose.connection.name,
      host: mongoose.connection.host
    },
    timestamp: new Date().toISOString()
  });
});

// Test database operation
app.get('/api/test-db', async (req, res) => {
  try {
    // Test database connection with a simple operation
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    
    res.json({
      success: true,
      message: 'Database test successful',
      ping: result,
      connection: {
        readyState: mongoose.connection.readyState,
        name: mongoose.connection.name,
        host: mongoose.connection.host
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Test server is running on port: ${port}`);
  console.log(`🔗 Test URL: http://localhost:${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/api/health`);
  console.log(`🧪 Database test: http://localhost:${port}/api/test-db`);
});
