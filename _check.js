const http = require('http');
const options = { hostname: 'localhost', port: 3000, path: '/', method: 'GET' };
const req = http.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Has phase2.js script:', data.includes('phase2.js'));
    console.log('Has both scripts:', data.includes('app.js') && data.includes('phase2.js'));
    // Check app.js content
    console.log('Has __arc:', data.includes('window.__arc'));
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.end();