require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

console.log('Starting simple test server...');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running successfully!' });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/parking-management';

console.log('Attempting to connect to MongoDB...');

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log('Available endpoints:');
      console.log(`  GET http://localhost:${port}/`);
      console.log(`  GET http://localhost:${port}/test`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('Starting server without database connection...');
    
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port} (without database)`);
    });
  });
