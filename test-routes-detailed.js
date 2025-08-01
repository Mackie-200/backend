require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

console.log('Testing routes individually with detailed error tracking...');

const routeFiles = [
  { name: 'auth', path: './routes/auth', endpoint: '/api/auth' },
  { name: 'contact', path: './routes/contact', endpoint: '/api/contact' },
  { name: 'admin', path: './routes/admin', endpoint: '/api/admin' },
  { name: 'parkingSpaces', path: './routes/parkingSpaces', endpoint: '/api/parking-spaces' },
  { name: 'bookings', path: './routes/bookings', endpoint: '/api/bookings' }
];

for (const route of routeFiles) {
  try {
    console.log(`\n--- Testing ${route.name} route ---`);
    console.log(`Loading from: ${route.path}`);
    
    const routeModule = require(route.path);
    console.log(`✅ Module loaded successfully`);
    
    console.log(`Registering route at: ${route.endpoint}`);
    app.use(route.endpoint, routeModule);
    console.log(`✅ ${route.name} route registered successfully`);
    
  } catch (error) {
    console.error(`❌ Error with ${route.name} route:`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    
    // Try to identify the specific issue
    if (error.message.includes('path-to-regexp')) {
      console.error(`   🔍 This appears to be a path-to-regexp issue`);
      console.error(`   🔍 Likely caused by invalid route pattern in ${route.name}.js`);
    }
  }
}

console.log('\n--- Starting test server ---');
try {
  const port = 3001;
  app.listen(port, () => {
    console.log(`✅ Test server running on http://localhost:${port}`);
    console.log('All routes that loaded successfully are available for testing');
    
    // List available endpoints
    console.log('\nAvailable endpoints:');
    routeFiles.forEach(route => {
      console.log(`  ${route.endpoint}/*`);
    });
    
    setTimeout(() => {
      console.log('\nShutting down test server...');
      process.exit(0);
    }, 2000);
  });
} catch (error) {
  console.error('❌ Error starting test server:', error.message);
  process.exit(1);
}
