const http = require('http');

// Test root endpoint
const req = http.get('http://localhost:5000/', (res) => {
  console.log(`Root Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Root Response: ${data}`);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error(`Server Error: ${err.message}`);
  process.exit(1);
});
