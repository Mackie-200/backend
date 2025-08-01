const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001; 

console.log(' Starting robust test server...');


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());


app.get('/', (req, res) => {
  console.log('GET / request received');
  res.json({ 
    message: 'Robust backend server is working!',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  const { email, password } = req.body;
  
  
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      user: { 
        name: 'Test User', 
        email: email, 
        role: 'user',
        id: '123'
      },
      token: 'test-jwt-token-' + Date.now()
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  console.log('Register request received:', req.body);
  
  const { name, email, password } = req.body;
  
  if (name && email && password) {
    res.json({
      success: true,
      message: 'Registration successful',
      user: { 
        name: name, 
        email: email, 
        role: 'user',
        id: '123'
      },
      token: 'test-jwt-token-' + Date.now()
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Name, email and password required'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server with explicit error handling
try {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server successfully started on http://localhost:${port}`);
    console.log('📋 Available endpoints:');
    console.log(`   GET  http://localhost:${port}/`);
    console.log(`   POST http://localhost:${port}/api/auth/login`);
    console.log(`   POST http://localhost:${port}/api/auth/register`);
    console.log('🎉 Backend ready for testing!');
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

} catch (error) {
  console.error('Failed to start server:', error);
}

console.log('Server setup completed, waiting for connections...');
