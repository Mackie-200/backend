const http = require('http');

console.log('🔍 Quick Server Test...\n');

function testServer() {
  console.log('Testing if server is running on http://localhost:5000...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('✅ Server is running!');
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📋 Response: ${body}`);
    });
  });

  req.on('error', (error) => {
    console.log('❌ Server is not running or not accessible');
    console.log(`💡 Error: ${error.message}`);
    console.log('🔧 Make sure to run: node server.js');
  });

  req.on('timeout', () => {
    console.log('⏰ Request timed out - server might be slow to respond');
    req.destroy();
  });

  req.end();
}

// Test immediately
testServer();

// Test again after 2 seconds
setTimeout(() => {
  console.log('\n🔄 Testing again after 2 seconds...');
  testServer();
}, 2000);
