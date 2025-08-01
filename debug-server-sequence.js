require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

console.log('🔍 Advanced Server Sequence Debugging...\n');

async function testServerSequence() {
  try {
    console.log('1️⃣ Creating Express app...');
    const app = express();
    console.log('   ✅ Express app created');

    console.log('\n2️⃣ Setting up middleware...');
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    console.log('   ✅ Middleware configured');

    console.log('\n3️⃣ Adding basic routes...');
    app.get('/', (req, res) => {
      res.json({ 
        message: 'Parking Space Management API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });

    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    });
    console.log('   ✅ Basic routes added');

    console.log('\n4️⃣ Loading and registering API routes...');
    
    // Test each route registration step by step
    const routeTests = [
      { name: 'auth', path: '/api/auth' },
      { name: 'contact', path: '/api/contact' },
      { name: 'parkingSpaces', path: '/api/parking-spaces' },
      { name: 'bookings', path: '/api/bookings' },
      { name: 'admin', path: '/api/admin' }
    ];

    for (const routeTest of routeTests) {
      try {
        console.log(`\n   🧪 Loading ${routeTest.name} routes...`);
        const route = require(`./routes/${routeTest.name}`);
        console.log(`      ✅ ${routeTest.name} route file loaded`);
        
        console.log(`   🔗 Registering ${routeTest.name} at ${routeTest.path}...`);
        app.use(routeTest.path, route);
        console.log(`      ✅ ${routeTest.name} routes registered successfully`);
        
      } catch (error) {
        console.log(`      ❌ ERROR with ${routeTest.name}:`);
        console.log(`      📄 Message: ${error.message}`);
        
        if (error.message.includes('Missing parameter name')) {
          console.log(`\n🎯 FOUND IT! The path-to-regexp error occurs when registering ${routeTest.name} routes!`);
          console.log(`   The error happens during app.use('${routeTest.path}', route)`);
          console.log(`   This means there's a malformed route pattern in ${routeTest.name}.js`);
          return;
        }
        
        throw error;
      }
    }

    console.log('\n5️⃣ Adding error handling middleware...');
    app.use((err, req, res, next) => {
      console.error('Server error:', err.stack);
      res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    });

    app.use('*', (req, res) => {
      res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
      });
    });
    console.log('   ✅ Error handling middleware added');

    console.log('\n🎉 SUCCESS! All routes registered without path-to-regexp error!');
    console.log('   This suggests the error might be timing-related or database-related.');
    
  } catch (error) {
    console.log('\n❌ ERROR CAUGHT:');
    console.log(`📄 Message: ${error.message}`);
    console.log(`📍 Stack:`);
    console.log(error.stack);
    
    if (error.message.includes('Missing parameter name')) {
      console.log('\n🎯 This is the path-to-regexp error we\'re looking for!');
      console.log('   The error occurs during route registration in the server sequence.');
    }
  }
}

// Also test with database connection like the real server
async function testWithDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('🗄️  Testing with Database Connection...\n');
  
  const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/parking-management';
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('   ✅ Database connected');
    
    // Now test the server sequence with database connected
    await testServerSequence();
    
    mongoose.connection.close();
    
  } catch (dbError) {
    console.log(`   ⚠️  Database connection failed: ${dbError.message}`);
    console.log('   Testing server sequence without database...\n');
    
    // Test without database
    await testServerSequence();
  }
}

// Run the tests
testWithDatabase().then(() => {
  console.log('\n🏁 Advanced debugging complete.');
}).catch((error) => {
  console.log('\n❌ Advanced debugging failed:', error.message);
  console.log(error.stack);
});
