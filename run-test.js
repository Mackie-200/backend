require('dotenv').config();
const http = require('http');

console.log(' Testing Main Server Startup...\n');


function testEndpoint(options, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          success: res.statusCode === expectedStatus
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Start the server in a child process
const { spawn } = require('child_process');

console.log('Starting server...');
const serverProcess = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let serverOutput = '';
let serverStarted = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('SERVER:', output.trim());
  
  // Check if server has started
  if (output.includes('Server running on') || output.includes('Backend server is ready')) {
    serverStarted = true;
    console.log('\n✅ Server appears to have started successfully!\n');
    
    // Wait a moment for server to fully initialize
    setTimeout(async () => {
      await runEndpointTests();
    }, 2000);
  }
});

serverProcess.stderr.on('data', (data) => {
  const error = data.toString();
  console.log('SERVER ERROR:', error.trim());
  
  // Check for specific errors
  if (error.includes('path-to-regexp')) {
    console.log('\n❌ DETECTED: path-to-regexp error - this is the issue we need to fix!');
  }
  if (error.includes('EADDRINUSE')) {
    console.log('\n❌ DETECTED: Port already in use - another server might be running');
  }
});

async function runEndpointTests() {
  console.log('🧪 Testing Server Endpoints...\n');
  
  const port = process.env.PORT || 5000;
  const baseUrl = `localhost:${port}`;
  
  const tests = [
    {
      name: 'Root Endpoint',
      options: {
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET'
      }
    },
    {
      name: 'Health Check',
      options: {
        hostname: 'localhost',
        port: port,
        path: '/health',
        method: 'GET'
      }
    },
    {
      name: 'Auth Routes Check',
      options: {
        hostname: 'localhost',
        port: port,
        path: '/api/auth',
        method: 'GET'
      },
      expectedStatus: 404 // This is expected since we don't have a GET /api/auth route
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const result = await testEndpoint(test.options, test.expectedStatus);
      
      if (result.success) {
        console.log(`   ✅ ${test.name}: Status ${result.status}`);
        if (result.data) {
          try {
            const jsonData = JSON.parse(result.data);
            console.log(`   📄 Response:`, JSON.stringify(jsonData, null, 2));
          } catch (e) {
            console.log(`   📄 Response: ${result.data.substring(0, 100)}...`);
          }
        }
      } else {
        console.log(`   ❌ ${test.name}: Status ${result.status} (expected ${test.expectedStatus || 200})`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
    console.log();
  }
  
  console.log('🏁 Endpoint testing complete. Shutting down server...\n');
  serverProcess.kill('SIGTERM');
  
  setTimeout(() => {
    console.log('📋 TEST SUMMARY:');
    console.log('================');
    
    if (serverStarted) {
      console.log('✅ Server startup: SUCCESS');
      console.log('✅ Basic endpoints: ACCESSIBLE');
      console.log('\n🎉 Your main server is working! You can now:');
      console.log('   1. Run: npm start');
      console.log('   2. Test endpoints at http://localhost:5000');
      console.log('   3. Connect your React frontend');
    } else {
      console.log('❌ Server startup: FAILED');
      console.log('\n🔧 Issues detected in server output:');
      console.log(serverOutput);
    }
    
    process.exit(0);
  }, 1000);
}

// Handle timeout if server doesn't start
setTimeout(() => {
  if (!serverStarted) {
    console.log('\n⏰ Server startup timeout. Checking output...\n');
    console.log('SERVER OUTPUT:');
    console.log(serverOutput);
    
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      console.log('\n❌ Server failed to start within timeout period.');
      console.log('💡 Run the comprehensive test first: node test-comprehensive.js');
      process.exit(1);
    }, 1000);
  }
}, 15000); // 15 second timeout
