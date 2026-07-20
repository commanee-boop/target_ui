const http = require('http');

const payload = JSON.stringify({
  fileName: 'verify-from-node',
  source: 'demo-camera',
  ext: 'MP4',
  kind: 'video',
  duration: '00:02:15',
  size: '1.24 GB',
  resolution: '1920 x 1080',
  fps: '25',
  recorder: 'admin',
  tags: ['MV', 'AMV'],
  metrics: { MV: 7, AMV: 3 },
  model: 'demo-model'
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/reports',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('POST_STATUS=' + res.statusCode);
    console.log(data);
    http.get('http://127.0.0.1:3001/api/reports', (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log('GET_REPORTS=' + data2);
      });
    });
  });
});

req.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

req.write(payload);
req.end();
