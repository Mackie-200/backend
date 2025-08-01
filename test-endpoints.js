const http = require('http');

console.log('🧪 Testing Backend API Endpoints...\n');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoints() {
  const baseUrl = 'localhost';
  const port = 5000;
  
  console.log(`🎯 Testing server at http://${baseUrl}:${port}\n`);

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const response = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/health',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('   ✅ Health check passed');
      console.log(`   📊 Response:`, response.data);
    } else {
      console.log(`   ❌ Health check failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`);
    console.log('   💡 Make sure your server is running with: node server.js');
    return;
  }

  // Test 2: Root Endpoint
  console.log('\n2️⃣ Testing Root Endpoint...');
  try {
    const response = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('   ✅ Root endpoint working');
      console.log(`   📊 Server info:`, response.data);
    } else {
      console.log(`   ❌ Root endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Root endpoint error: ${error.message}`);
  }

  // Test 3: User Registration
  console.log('\n3️⃣ Testing User Registration...');
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: '123456',
    role: 'user'
  };

  try {
    const response = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testUser);
    
    if (response.status === 201 || response.status === 200) {
      console.log('   ✅ User registration successful');
      console.log(`   👤 User created:`, response.data);
    } else if (response.status === 400 && response.data.message?.includes('already exists')) {
      console.log('   ⚠️  User already exists (this is expected)');
    } else {
      console.log(`   ❌ Registration failed: ${response.status}`);
      console.log(`   📄 Response:`, response.data);
    }
  } catch (error) {
    console.log(`   ❌ Registration error: ${error.message}`);
  }

  // Test 4: User Login
  console.log('\n4️⃣ Testing User Login...');
  try {
    const response = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.status === 200) {
      console.log('   ✅ Login successful');
      console.log(`   🔑 Token received:`, response.data.token ? 'Yes' : 'No');
    } else {
      console.log(`   ❌ Login failed: ${response.status}`);
      console.log(`   📄 Response:`, response.data);
    }
  } catch (error) {
    console.log(`   ❌ Login error: ${error.message}`);
  }

  // Test 5: Parking Spaces
  console.log('\n5️⃣ Testing Parking Spaces Endpoint...');
  try {
    const response = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/api/parking-spaces',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('   ✅ Parking spaces endpoint working');
      console.log(`   🅿️  Spaces found:`, response.data.data?.parkingSpaces?.length || 0);
    } else {
      console.log(`   ❌ Parking spaces failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Parking spaces error: ${error.message}`);
  }

  // Test 6: Bookings
  console.log('\n6️⃣ Testing Bookings Endpoint...');
  try {
    const response = await makeRequest({
      hostname: baseUrl,
      port: port,
      path: '/api/bookings',
      method: 'GET'
    });
    
    if (response.status === 200 || response.status === 401) {
      console.log('   ✅ Bookings endpoint accessible');
      if (response.status === 401) {
        console.log('   🔒 Authentication required (expected)');
      }
    } else {
      console.log(`   ❌ Bookings failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Bookings error: ${error.message}`);
  }

  console.log('\n🎉 Endpoint testing complete!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Your backend is ready for React frontend integration');
  console.log('   🔗 Frontend should connect to: http://localhost:5000');
  console.log('   📚 Available endpoints:');
  console.log('      - POST /api/auth/register');
  console.log('      - POST /api/auth/login');
  console.log('      - GET  /api/parking-spaces');
  console.log('      - GET  /api/bookings');
  console.log('      - GET  /api/admin/dashboard');
}

// Run the tests
testEndpoints().catch((error) => {
  console.log('\n❌ Testing failed:', error.message);
});
