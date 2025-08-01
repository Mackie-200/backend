require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('Environment variables loaded:');
console.log('ATLAS_URI:', process.env.ATLAS_URI ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT);

const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/parking-management';

console.log('\nAttempting to connect to MongoDB...');
console.log('URI (masked):', mongoUri.replace(/\/\/.*@/, '//***:***@'));

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
})
  .then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    console.log('Database name:', mongoose.connection.name);
    console.log('Connection state:', mongoose.connection.readyState);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  });

// Set a timeout to prevent hanging
setTimeout(() => {
  console.log('❌ Connection timeout after 15 seconds');
  process.exit(1);
}, 15000);
