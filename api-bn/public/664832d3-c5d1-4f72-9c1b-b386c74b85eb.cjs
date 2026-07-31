// scripts/diag_e2e.cjs (v2) — trace resolve-profile via public API only,
// no direct Prisma (avoids driver-adapter requirement in scripts context).
const BASE = 'http://localhost:3000/api/v1';
const API_KEY = 'bn-secret-api-key';

async function api(method, ep, body, token) {
  const headers = { 'x-api-key': API_KEY };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${ep}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

function decodeJwt(token) {
  const [h, p] = token.split('.');
  const b64 = (s) => {
    const padded = s + '='.repeat((4 - (s.length % 4)) % 4);
    return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  };
  return { header: JSON.parse(b64(h)), payload: JSON.parse(b64(p)) };
}

(async () => {
  console.log('=== 1. ADMIN LOGIN ===');
  const a = await api('POST', '/auth/login', { identifier: 'testtest@test.com', password: 'testtest' });
  if (a.status !== 200 || !a.json.data.accessToken) {
    console.log('admin login FAILED:', a.status, a.text);
    process.exit(1);
  }
  const adminTok = a.json.data.accessToken;
  console.log('admin OK');

  console.log('\n=== 2. POST /master/teachers (e2e_teacher) ===');
  const r = await api('POST', '/master/teachers', {
    email: 'e2e_teacher@test.com',
    password: 'P@ssw0rd12345',
    fullname: 'E2E Seed Teacher',
    nip: '198001012005011099',
    gender: 'L',
    religion: 'Islam',
    phoneNumber: '081234567890',
    status: 'Aktif',
  }, adminTok);
  console.log('POST status:', r.status);
  console.log('POST message:', r.json && r.json.message);
  if (r.json && r.json.data) {
    console.log('teacher created: id=' + r.json.data.id + ' userId=' + r.json.data.userId);
  }
  const teacherPayload = r.json && r.json.data;

  console.log('\n=== 3. E2E_TEACHER LOGIN + JWT DECODE ===');
  const l = await api('POST', '/auth/login', { identifier: 'e2e_teacher@test.com', password: 'P@ssw0rd12345' });
  console.log('login status:', l.status);
  if (!l.json || !l.json.data || !l.json.data.accessToken) {
    console.log('LOGIN FAILED:', l.text.slice(0, 300));
    process.exit(1);
  }
  const teacherTok = l.json.data.accessToken;
  const { payload } = decodeJwt(teacherTok);
  console.log('JWT payload:', JSON.stringify(payload, null, 2));
  const jwtUserId = payload.id;

  console.log('\n=== 4. VERIFY LINKAGE via GET /master/teachers?userId=... ===');
  console.log('Calling GET /master/teachers?userId=' + jwtUserId);
  const gt = await api('GET', '/master/teachers?userId=' + jwtUserId + '&limit=5&includeUser=false', null, adminTok);
  console.log('GET status:', gt.status);
  console.log('GET total:', gt.json && gt.json.total);
  console.log('GET data count:', gt.json && gt.json.data ? gt.json.data.length : 0);
  if (gt.json && gt.json.data && gt.json.data.length > 0) {
    const t = gt.json.data[0];
    console.log('Found teacher:', JSON.stringify({ id: t.id, userId: t.userId, email: t.email, fullname: t.fullname, status: t.status }, null, 2));
  } else {
    console.log('NO TEACHER FOUND FOR userId=' + jwtUserId);
    console.log('Full GET response:', JSON.stringify(gt.json, null, 2));
  }

  console.log('\n=== 5. PROBE /learn/materials POST with teacher token ===');
  const m = await api('POST', '/learn/materials', {
    title: 'Diag Material',
    description: 'Diag',
    content: 'test',
    classId: '00000000-0000-0000-0000-000000000000',
    subjectId: '00000000-0000-0000-0000-000000000000',
  }, teacherTok);
  console.log('materials POST status:', m.status);
  console.log('materials response:', JSON.stringify(m.json, null, 2));

  console.log('\n=== 6. SUMARY ===');
  if (m.status === 403) {
    console.log('==> 403 FAIL. Possible link failures:');
    console.log('   a) JWT userId ≠ teacher.userId');
    console.log('   b) resolve-profile calling wrong DB');
    console.log('   c) teacher table missing userId linkage');
  } else if (m.status >= 200 && m.status < 300) {
    console.log('==> OK — material create succeeded');
  } else {
    console.log('==> Other error:', m.status, m.text.slice(0, 200));
  }
})().catch(err => { console.error('FATAL', err); process.exit(1); });
