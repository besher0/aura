const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');

function request(server, path) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    http
      .get({ hostname: '127.0.0.1', port: address.port, path }, (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(body) }));
      })
      .on('error', reject);
  });
}

test('public health endpoint returns the standard success shape', async (t) => {
  const server = http.createServer(app).listen(0);
  t.after(() => server.close());
  const response = await request(server, '/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { success: true, data: { status: 'ok' } });
});

test('admin dashboard rejects unauthenticated requests', async (t) => {
  const server = http.createServer(app).listen(0);
  t.after(() => server.close());
  const response = await request(server, '/api/admin/dashboard');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'AUTH_REQUIRED');
});
