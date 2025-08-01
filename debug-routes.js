require('dotenv').config();
const express = require('express');

console.log('🔍 Debugging Route Registration Issues...\n');

const routeFiles = ['auth', 'contact', 'admin', 'parkingSpaces', 'bookings'];

async function testRouteRegistration() {
  for (const routeName of routeFiles) {
    console.log(`\n🧪 Testing ${routeName}.js route registration...`);
    
    try {
      // Create a fresh Express app for each test
      const app = express();
      app.use(express.json());
      
      // Load the route
      const route = require(`./routes/${routeName}`);
      console.log(`   ✅ Route file loaded successfully`);
      
      // Try to register the route
      const routePath = `/api/${routeName === 'parkingSpaces' ? 'parking-spaces' : routeName}`;
      app.use(routePath, route);
      console.log(`   ✅ Route registered successfully at ${routePath}`);
      
    } catch (error) {
      console.log(`   ❌ ERROR in ${routeName}.js:`);
      console.log(`   📄 Error message: ${error.message}`);
      console.log(`   📍 Stack trace:`);
      console.log(error.stack);
      
      // Check if it's the path-to-regexp error
      if (error.message.includes('Missing parameter name')) {
        console.log(`\n🎯 FOUND THE ISSUE! The path-to-regexp error is in ${routeName}.js`);
        console.log('   This route file has a malformed route pattern.');
        console.log('   Look for patterns like:');
        console.log('   - router.get("/:") // missing parameter name');
        console.log('   - router.get("/:/something") // malformed parameter');
        console.log('   - router.get("/:param:") // extra colon');
        break;
      }
    }
  }
}

// Test individual route patterns
async function testSpecificPatterns() {
  console.log('\n🔬 Testing Common Problematic Patterns...\n');
  
  const testPatterns = [
    '/',
    '/:id',
    '/owner/my-spaces',
    '/dashboard',
    '/users',
    '/parking-spaces',
    '/bookings',
    '/analytics',
    '/me'
  ];
  
  for (const pattern of testPatterns) {
    try {
      const app = express();
      const router = express.Router();
      
      // Test the pattern
      router.get(pattern, (req, res) => res.json({ test: true }));
      app.use('/test', router);
      
      console.log(`   ✅ Pattern "${pattern}" is valid`);
    } catch (error) {
      console.log(`   ❌ Pattern "${pattern}" is INVALID: ${error.message}`);
    }
  }
}

// Run the tests
testRouteRegistration().then(() => {
  console.log('\n' + '='.repeat(50));
  return testSpecificPatterns();
}).then(() => {
  console.log('\n🏁 Route debugging complete.');
}).catch((error) => {
  console.log('\n❌ Debugging failed:', error.message);
});
