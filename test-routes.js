require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

console.log('Testing routes individually...');

// Test each route file one by one
const routeFiles = [
  { name: 'auth', path: './routes/auth' },
  { name: 'contact', path: './routes/contact' },
  { name: 'admin', path: './routes/admin' },
  { name: 'parkingSpaces', path: './routes/parkingSpaces' },
  { name: 'bookings', path: './routes/bookings' }
];

for (const route of routeFiles) {
  try {
    console.log(`Loading ${route.name} route...`);
    const routeModule = require(route.path);
    app.use(`/api/${route.name}`, routeModule);
    console.log(`✅ ${route.name} route loaded successfully`);
  } catch (error) {
    console.error(`❌ Error loading ${route.name} route:`, error.message);
    console.error('Stack trace:', error.stack);
  }
}

console.log('Route testing completed.');
process.exit(0);
