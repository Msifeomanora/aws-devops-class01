// smoke-test.js
require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

console.log('🔥 Running smoke tests...');
console.log(`Testing server at http://${HOST}:${PORT}`);

// Start the server
const { createApp } = require('./server');
const app = createApp();
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server started on port ${PORT}`);
  
  // Give server a moment to fully start
  setTimeout(() => {
    runTests();
  }, 1000);
});

function runTests() {
  // Test 1: Check if server responds
  console.log('\n📝 Test 1: Checking if server responds...');
  
  http.get(`http://${HOST}:${PORT}/`, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Test 1 PASSED: Server is responding');
      
      // Test 2: Check response content
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📝 Test 2: Checking response content...');
        if (data.includes('html')) {
          console.log('✅ Test 2 PASSED: Server returns HTML content');
          console.log('\n🎉 All smoke tests passed!');
          cleanup(0);
        } else {
          console.log('❌ Test 2 FAILED: Expected HTML content');
          cleanup(1);
        }
      });
    } else {
      console.log(`❌ Test 1 FAILED: Expected status 200, got ${res.statusCode}`);
      cleanup(1);
    }
  }).on('error', (err) => {
    console.log('❌ Test 1 FAILED: Could not connect to server');
    console.log('Error:', err.message);
    cleanup(1);
  });
}

function cleanup(exitCode) {
  console.log('\n🧹 Cleaning up...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(exitCode);
  });
}