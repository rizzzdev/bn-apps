/**
 * Structural smoke test for learn-bn.
 * Bypasses `src/index.ts` (avoids any DB / server init) by importing
 * the `app` directly and binding to an ephemeral port.
 *
 * Pass criteria: 2xx, 3xx, 401 (auth required), 403, 404.
 * Fail criteria:  5xx (server error), timeout, import-time crash.
 */
import { app } from '@/app';
import http from 'http';

interface RouteSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
}

const ROUTES: RouteSpec[] = [
  // --- Auth (sentri client mode) ---
  { method: 'POST', path: '/api/v1/auth/login' },
  { method: 'GET', path: '/api/v1/auth/me' },

  // --- Attachments (public) ---
  { method: 'GET', path: '/api/v1/attachments' },

  // --- LMS (auth required) ---
  { method: 'GET', path: '/api/v1/materials' },
  { method: 'GET', path: '/api/v1/assignments' },
  { method: 'GET', path: '/api/v1/assignment-submissions' },
  { method: 'GET', path: '/api/v1/quizzes' },
  { method: 'GET', path: '/api/v1/grades' },
  { method: 'GET', path: '/api/v1/dashboard' },
];

async function run() {
  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  console.log(`[learn-bn] smoke-test bound to ephemeral port ${port}`);

  let failed = 0;
  let total = 0;

  const authed = !!process.env.AUTH_TOKEN;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authed) headers['Authorization'] = `Bearer ${process.env.AUTH_TOKEN}`;

  for (const route of ROUTES) {
    total++;
    try {
      const res = await fetch(`http://127.0.0.1:${port}${route.path}`, {
        method: route.method,
        headers,
        signal: AbortSignal.timeout(5000),
      });
      const status = res.status;
      let body = '';
      try {
        body = await res.text();
        if (body.length > 200) body = body.slice(0, 200) + '...';
      } catch {}
      const icon = authed
        ? (status >= 200 && status < 300 ? 'OK' : status >= 500 ? 'FAIL' : 'NON-2XX')
        : status >= 500 ? 'FAIL' : status === 401 || status === 403 ? 'AUTH' : 'OK';
      console.log(`  [${icon} ${status}] ${route.method} ${route.path} -> ${body}`);
      // With AUTH_TOKEN we expect 2xx; without, we tolerate 401/403/404.
      if (authed && (status < 200 || status >= 300)) failed++;
      else if (!authed && status >= 500) failed++;
    } catch (e: any) {
      console.log(`  [FAIL timeout/crash] ${route.method} ${route.path} -> ${e.message}`);
      failed++;
    }
  }

  server.close();
  console.log(`\n--- learn-bn smoke: ${total - failed}/${total} OK, ${failed} FAILED ---`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Script crashed:', e);
  process.exit(2);
});
