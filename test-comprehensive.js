require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

console.log('🧪 Starting Comprehensive Backend Test Suite...\n');

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables:');
const requiredEnvVars = ['ATLAS_URI', 'JWT_SECRET', 'PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing environment variables:', missingVars);
} else {
  console.log('✅ All required environment variables present');
}
console.log(`   - ATLAS_URI: ${process.env.ATLAS_URI ? '✅ Set' : '❌ Missing'}`);
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`   - PORT: ${process.env.PORT || 5000}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

// Test 2: Route File Loading
console.log('2️⃣ Testing Route File Loading:');
const routeFiles = ['auth', 'contact', 'admin', 'parkingSpaces', 'bookings'];
const routeResults = {};

routeFiles.forEach(routeName => {
  try {
    const route = require(`./routes/${routeName}`);
    routeResults[routeName] = { status: 'success', route };
    console.log(`   ✅ ${routeName}.js loaded successfully`);
  } catch (error) {
    routeResults[routeName] = { status: 'error', error: error.message };
    console.log(`   ❌ ${routeName}.js failed to load: ${error.message}`);
  }
});
console.log();

// Test 3: Model Loading
console.log('3️⃣ Testing Model Loading:');
const modelFiles = ['User', 'ParkingSpace', 'Booking'];
const modelResults = {};

modelFiles.forEach(modelName => {
  try {
    const model = require(`./models/${modelName}`);
    modelResults[modelName] = { status: 'success', model };
    console.log(`   ✅ ${modelName}.js model loaded successfully`);
  } catch (error) {
    modelResults[modelName] = { status: 'error', error: error.message };
    console.log(`   ❌ ${modelName}.js model failed to load: ${error.message}`);
  }
});
console.log();

// Test 4: Database Connection
console.log('4️⃣ Testing Database Connection:');
const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/parking-management';

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000,
})
.then(() => {
  console.log('   ✅ MongoDB connection successful');
  console.log(`   📊 Database: ${mongoose.connection.name}`);
  console.log(`   🔗 Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}\n`);
  
  // Test 5: Server Creation and Route Registration
  console.log('5️⃣ Testing Server Creation and Route Registration:');
  
  try {
    const app = express();
    
    // Middleware
    app.use(express.json());
    
    // Test route registration
    let routeRegistrationErrors = [];
    
    if (routeResults.auth.status === 'success') {
      try {
        app.use('/api/auth', routeResults.auth.route);
        console.log('   ✅ Auth routes registered successfully');
      } catch (error) {
        routeRegistrationErrors.push(`Auth: ${error.message}`);
        console.log(`   ❌ Auth routes registration failed: ${error.message}`);
      }
    }
    
    if (routeResults.contact.status === 'success') {
      try {
        app.use('/api/contact', routeResults.contact.route);
        console.log('   ✅ Contact routes registered successfully');
      } catch (error) {
        routeRegistrationErrors.push(`Contact: ${error.message}`);
        console.log(`   ❌ Contact routes registration failed: ${error.message}`);
      }
    }
    
    if (routeResults.parkingSpaces.status === 'success') {
      try {
        app.use('/api/parking-spaces', routeResults.parkingSpaces.route);
        console.log('   ✅ Parking Spaces routes registered successfully');
      } catch (error) {
        routeRegistrationErrors.push(`ParkingSpaces: ${error.message}`);
        console.log(`   ❌ Parking Spaces routes registration failed: ${error.message}`);
      }
    }
    
    if (routeResults.bookings.status === 'success') {
      try {
        app.use('/api/bookings', routeResults.bookings.route);
        console.log('   ✅ Bookings routes registered successfully');
      } catch (error) {
        routeRegistrationErrors.push(`Bookings: ${error.message}`);
        console.log(`   ❌ Bookings routes registration failed: ${error.message}`);
      }
    }
    
    if (routeResults.admin.status === 'success') {
      try {
        app.use('/api/admin', routeResults.admin.route);
        console.log('   ✅ Admin routes registered successfully');
      } catch (error) {
        routeRegistrationErrors.push(`Admin: ${error.message}`);
        console.log(`   ❌ Admin routes registration failed: ${error.message}`);
      }
    }
    
    console.log();
    
    // Test Summary
    console.log('📋 TEST SUMMARY:');
    console.log('================');
    
    const envTestPassed = missingVars.length === 0;
    const routeTestPassed = Object.values(routeResults).every(r => r.status === 'success');
    const modelTestPassed = Object.values(modelResults).every(m => m.status === 'success');
    const dbTestPassed = mongoose.connection.readyState === 1;
    const routeRegTestPassed = routeRegistrationErrors.length === 0;
    
    console.log(`Environment Variables: ${envTestPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Route File Loading: ${routeTestPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Model Loading: ${modelTestPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Database Connection: ${dbTestPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Route Registration: ${routeRegTestPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    const allTestsPassed = envTestPassed && routeTestPassed && modelTestPassed && dbTestPassed && routeRegTestPassed;
    
    console.log('\n🎯 OVERALL RESULT:');
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! Your backend is ready to run.');
      console.log('💡 You can now start your server with: npm start');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
      
      if (!envTestPassed) {
        console.log('   - Check your .env file configuration');
      }
      if (!routeTestPassed) {
        console.log('   - Review route file syntax and dependencies');
      }
      if (!modelTestPassed) {
        console.log('   - Review model file syntax and mongoose schemas');
      }
      if (!dbTestPassed) {
        console.log('   - Check your MongoDB connection string and network access');
      }
      if (!routeRegTestPassed) {
        console.log('   - Review route registration and Express router setup');
        console.log('   - Route registration errors:', routeRegistrationErrors);
      }
    }
    
  } catch (error) {
    console.log(`❌ Server creation failed: ${error.message}`);
  }
  
  // Close database connection
  mongoose.connection.close();
  
})
.catch(err => {
  console.log(`   ❌ MongoDB connection failed: ${err.message}`);
  console.log('   💡 Check your connection string and network access\n');
  
  // Continue with other tests even without database
  console.log('📋 TEST SUMMARY (without database):');
  console.log('====================================');
  
  const envTestPassed = missingVars.length === 0;
  const routeTestPassed = Object.values(routeResults).every(r => r.status === 'success');
  const modelTestPassed = Object.values(modelResults).every(m => m.status === 'success');
  
  console.log(`Environment Variables: ${envTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Route File Loading: ${routeTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Model Loading: ${modelTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Connection: ❌ FAIL`);
  
  if (envTestPassed && routeTestPassed && modelTestPassed) {
    console.log('\n💡 Your backend code is correct, but database connection failed.');
    console.log('   Check your MongoDB Atlas connection string and network access.');
  }
});
