/**
 * Structural smoke test for master-data-bn.
 * Bypasses `src/index.ts` (avoids Prisma migrate + DB connect) by importing
 * `createServer()` directly and binding to an ephemeral port.
 *
 * Pass criteria (unauthed): 2xx, 3xx, 401, 403, 404.
 * Fail criteria (unauthed):  5xx, timeout, import-time crash.
 *
 * Authed pass: POST /api/v1/auth/login with seeded credentials, then each
 * LIST endpoint must return 2xx with Bearer token.
 *
 * KEEP_ALIVE mode (set `KEEP_ALIVE=1`): after authed pass succeeds, emits
 * `__SMOKE_TOKEN__:<jwt>` and `__SMOKE_PORT__:<port>` to stdout and leaves
 * the server running so sibling smoke-tests can reuse the token via
 * `process.env.AUTH_TOKEN` + `process.env.MASTER_API_URL`.
 */
import { createServer } from '@/app/index';
import http from 'http';

interface RouteSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
}

const UNAUTHED_ROUTES: RouteSpec[] = [
  { method: 'POST', path: '/api/v1/auth/login' },
  { method: 'GET', path: '/api/v1/auth/me' },
  { method: 'GET', path: '/api/v1/users' },
  { method: 'GET', path: '/api/v1/users/statistic' },
  { method: 'GET', path: '/api/v1/academic-years' },
  { method: 'GET', path: '/api/v1/academic-years/statistic' },
  { method: 'GET', path: '/api/v1/semesters' },
  { method: 'GET', path: '/api/v1/semesters/statistic' },
  { method: 'GET', path: '/api/v1/classes' },
  { method: 'GET', path: '/api/v1/classes/statistic' },
  { method: 'GET', path: '/api/v1/majors' },
  { method: 'GET', path: '/api/v1/students' },
  { method: 'GET', path: '/api/v1/students/statistic' },
  { method: 'GET', path: '/api/v1/teachers' },
  { method: 'GET', path: '/api/v1/teachers/statistic' },
  { method: 'GET', path: '/api/v1/subjects' },
  { method: 'GET', path: '/api/v1/attachments/file/missing-url-test' },
];

const AUTHED_LIST_ROUTES: RouteSpec[] = [
  { method: 'GET', path: '/api/v1/users' },
  { method: 'GET', path: '/api/v1/academic-years' },
  { method: 'GET', path: '/api/v1/semesters' },
  { method: 'GET', path: '/api/v1/classes' },
  { method: 'GET', path: '/api/v1/majors' },
  { method: 'GET', path: '/api/v1/students' },
  { method: 'GET', path: '/api/v1/teachers' },
  { method: 'GET', path: '/api/v1/subjects' },
  { method: 'GET', path: '/api/v1/dashboard/summary' },
];

const TEST_CREDENTIALS = { identifier: 'testtest@test.com', password: 'testtest' };
const BOOTSTRAP_API_KEY = process.env.API_KEY ?? 'master-data-bn-api-key';
const KEEP_ALIVE = process.env.KEEP_ALIVE === '1';

async function runUnauthed(port: number, failed: { count: number }) {
  console.log('\n--- unauthed pass (expect 401/4xx, never 5xx) ---');
  for (const route of UNAUTHED_ROUTES) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      const status = res.status;
      const body = (await res.text()).slice(0, 200);
      const icon = status >= 500 ? 'FAIL' : status === 401 || status === 403 ? 'AUTH' : 'OK';
      console.log(`  [${icon} ${status}] ${route.method} ${route.path} -> ${body}`);
      if (status >= 500) failed.count++;
    } catch (e: any) {
      console.log(`  [FAIL timeout/crash] ${route.method} ${route.path} -> ${e.message}`);
      failed.count++;
    }
  }
}

async function runAuthed(port: number, failed: { count: number }): Promise<string | undefined> {
  console.log('\n--- authed pass (login + Bearer token; expect 2xx) ---');

  let token: string | undefined;
  const tryLogin = () =>
    fetch(`http://127.0.0.1:${port}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CREDENTIALS),
      signal: AbortSignal.timeout(8000),
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

  const lr = await tryLogin();
  if (lr.status >= 200 && lr.status < 300) {
    token = lr.body?.data?.accessToken ?? lr.body?.accessToken ?? lr.body?.data?.token ?? lr.body?.token;
    if (token) {
      console.log(`  [OK ${lr.status}] login -> got token (${token.length} chars)`);
    } else {
      console.log(`  [FAIL] login returned 2xx but no token field -> ${JSON.stringify(lr.body).slice(0, 200)}`);
      failed.count++;
      return undefined;
    }
  } else if (lr.status !== 401) {
    console.log(`  [FAIL ${lr.status}] login -> ${JSON.stringify(lr.body).slice(0, 200)}`);
    failed.count++;
    return undefined;
  } else {
    console.log(`  [info] login returned 401 (user not found). Attempting to register via API key...`);
  }

  if (!token) {
    const regRes = await fetch(`http://127.0.0.1:${port}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': BOOTSTRAP_API_KEY },
      body: JSON.stringify({
        identifiers: [{ type: 'email', value: TEST_CREDENTIALS.identifier }],
        password: TEST_CREDENTIALS.password,
        roles: ['super_admin'],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const regBody: any = await regRes.json().catch(() => ({}));
    if (regRes.status >= 200 && regRes.status < 300) {
      console.log(`  [OK ${regRes.status}] register -> user created`);
    } else if (!/EXISTS|ALREADY|409/i.test(regRes.status + JSON.stringify(regBody))) {
      console.log(`  [FAIL ${regRes.status}] register -> ${JSON.stringify(regBody).slice(0, 200)}`);
      failed.count++;
      return undefined;
    }
    const lr2 = await tryLogin();
    if (lr2.status >= 200 && lr2.status < 300) {
      token = lr2.body?.data?.accessToken ?? lr2.body?.accessToken ?? lr2.body?.data?.token ?? lr2.body?.token;
      if (!token) {
        console.log(`  [FAIL] retry-login returned 2xx but no token -> ${JSON.stringify(lr2.body).slice(0, 200)}`);
        failed.count++;
        return undefined;
      }
      console.log(`  [OK ${lr2.status}] retry-login -> got token (${token.length} chars)`);
    } else {
      console.log(`  [FAIL ${lr2.status}] retry-login -> ${JSON.stringify(lr2.body).slice(0, 200)}`);
      failed.count++;
      return undefined;
    }
  }

  for (const route of AUTHED_LIST_ROUTES) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
      const status = res.status;
      const body = (await res.text()).slice(0, 200);
      const icon = status >= 500 ? 'FAIL' : status >= 200 && status < 300 ? 'OK' : 'NON-2XX';
      console.log(`  [${icon} ${status}] ${route.method} ${route.path} -> ${body}`);
      if (status < 200 || status >= 300) failed.count++;
    } catch (e: any) {
      console.log(`  [FAIL timeout/crash] ${route.method} ${route.path} -> ${e.message}`);
      failed.count++;
    }
  }

  return token;
}

async function run() {
  const app = createServer();
  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  console.log(`[master-data] smoke-test bound to ephemeral port ${port}`);

  const failed = { count: 0 };
  let token: string | undefined;

  await runUnauthed(port, failed);
  token = await runAuthed(port, failed);

  console.log(`\n--- master-data smoke: ${failed.count === 0 ? 'ALL PASS' : `${failed.count} FAILED`} ---`);

  if (KEEP_ALIVE && token) {
    // Emit markers for the orchestrator to capture.
    console.log(`__SMOKE_TOKEN__:${token}`);
    console.log(`__SMOKE_PORT__:${port}`);
    console.log(`[KEEP_ALIVE] server stays bound on port ${port}; awaiting SIGTERM`);
    // Stay alive — orchestrator will kill us.
    process.on('SIGTERM', () => {
      console.log('[KEEP_ALIVE] SIGTERM received; closing');
      server.close();
      process.exit(0);
    });
    process.on('SIGINT', () => {
      console.log('[KEEP_ALIVE] SIGINT received; closing');
      server.close();
      process.exit(0);
    });
    return;
  }

  server.close();
  process.exit(failed.count > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Script crashed:', e);
  process.exit(2);
});
