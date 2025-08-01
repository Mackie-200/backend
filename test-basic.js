const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

console.log('Starting basic test server...');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Basic server is working!' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({
    success: true,
    message: 'Test login endpoint working',
    user: { name: 'Test User', email: 'test@test.com', role: 'user' },
    token: 'test-token'
  });
});

app.post('/api/auth/register', (req, res) => {
  console.log('Register request received:', req.body);
  res.json({
    success: true,
    message: 'Test register endpoint working',
    user: { name: req.body.name, email: req.body.email, role: 'user' },
    token: 'test-token'
  });
});

app.listen(port, () => {
  console.log(` Basic test server running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log(`   GET  http://localhost:${port}/`);
  console.log(`   POST http://localhost:${port}/api/auth/login`);
  console.log(`   POST http://localhost:${port}/api/auth/register`);
});

console.log('Server setup complete');
