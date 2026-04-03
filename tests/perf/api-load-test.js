// k6 API Load Test Script
// Usage: k6 run tests/perf/api-load-test.js
// Install k6: https://k6.io/docs/getting-started/installation/

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],     // Less than 1% failure rate
    errors: ['rate<0.05'],             // Less than 5% error rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

export function setup() {
  // Create a test user and get token
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email: `loadtest-${Date.now()}@test.com`,
    password: 'password123',
    name: 'Load Test User',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  let token = null;
  if (registerRes.status === 201) {
    token = JSON.parse(registerRes.body).data?.token;
  }

  return { token };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    ...(data.token ? { 'Authorization': `Bearer ${data.token}` } : {}),
  };

  // Test 1: Login
  const loginStart = Date.now();
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'loadtest@test.com',
    password: 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  loginDuration.add(Date.now() - loginStart);

  check(loginRes, {
    'login status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(loginRes.status !== 200 && loginRes.status !== 401);

  // Test 2: Dashboard Stats (requires auth)
  if (data.token) {
    const dashboardStart = Date.now();
    const dashboardRes = http.get(`${BASE_URL}/dashboard/stats`, {
      headers,
    });
    dashboardDuration.add(Date.now() - dashboardStart);

    check(dashboardRes, {
      'dashboard stats status': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(dashboardRes.status !== 200 && dashboardRes.status !== 401);
  }

  // Test 3: List workflows
  const workflowsRes = http.get(`${BASE_URL}/workflows`, {
    headers,
  });

  check(workflowsRes, {
    'workflows list status': (r) => r.status === 200 || r.status === 401,
  });
  errorRate.add(workflowsRes.status !== 200 && workflowsRes.status !== 401);

  // Wait between iterations
  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, opts) {
  const indent = opts.indent || '';
  let summary = '\n${indent}Test Summary:\n';
  summary += `${indent}=================\n`;
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  summary += `${indent}Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}\n`;
  summary += `${indent}Response Times:\n`;
  summary += `${indent}  Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  return summary;
}
