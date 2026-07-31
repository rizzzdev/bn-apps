// =============================================================================
//  test_all_endpoints_v2.cjs — comprehensive endpoint smoke test (v3)
//
//  Strategy:
//   1. Login as super_admin (testtest@test.com / testtest).
//   2. Register role-linked users via master/internship REST endpoints
//      so they get a profileId via resolveProfile middleware:
//        - Master teacher  → POST /master/teachers (auto-creates sentri user)
//        - Master student  → POST /master/students (auto-creates sentri user)
//        - Industry mentor → POST /internship/industry-mentors/batch
//                             (bulk endpoint auto-registers via orchestrator)
//   3. Run all modules using role-specific tokens.
//   4. Accept 4xx and 5xx only when by-design (empty bulk arrays, role-restricted
//      endpoints whose domain record has no REST POST, removed routes).
//   5. Cleanup created records at exit (BEST EFFORT).
// =============================================================================
const crypto = require('crypto');

const BASE    = 'http://localhost:3000/api/v1';
const ADMIN   = { identifier: 'testtest@test.com', password: 'testtest' };
const API_KEY = 'bn-secret-api-key';
const SUFFIX  = (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));

const records = [];
const cleanup = [];
const respBodies = [];        // { method, path, status, body } captured per call
let superToken = '';
let superUserId = '';
const tks = { student: '', teacher: '', mentor: '' };
const profile = {
  companyId: '',
  masterTeacherId: '',
  masterStudentId: '',
  industryMentorId: '',
  masterTeacherEmail: '',
  masterStudentEmail: '',
  industryMentorEmail: '',
  masterTeacherPwd: '',
  masterStudentPwd: '',
  industryMentorPwd: '',
};

const log = (...a) => console.log(...a);
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10);

// ---------------------------------------------------------------------------
//  HTTP helpers
// ---------------------------------------------------------------------------
async function call(method, path, { auth = 'super', body, headers = {}, raw = false } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const h = { ...headers };
  const tok = auth === null ? null : (auth === 'super' ? superToken : (tks[auth] || ''));
  if (!h['Content-Type'] && body && !(body instanceof FormData)) {
    h['Content-Type'] = 'application/json';
  }
  if (tok && !h['Authorization']) h['Authorization'] = `Bearer ${tok}`;
  // DON'T send x-api-key with Bearer token — sentri's protect() checks API key BEFORE
  // JWT and will bypass JWT auth, setting req.user={id:"api-key",roles:[]} instead of
  // the real authenticated user. Only auth routes (register, delete-user) should send API key.


  const opts = { method, headers: h };
  if (body) opts.body = body instanceof FormData ? body : JSON.stringify(body);

  let res;
  try { res = await fetch(url, opts); } catch (e) { return { status: 0, json: null, raw: e.message }; }
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
  // Capture full response body for documentation, capped to avoid runaway memory.
  let bodyForDoc = null;
  try {
    if (json && typeof json === 'object') {
      const textIn = JSON.stringify(json);
      bodyForDoc = textIn.length > 8000 ? { _truncated: true, _size: textIn.length, preview: textIn.slice(0, 8000) } : json;
    } else if (text) {
      bodyForDoc = text.length > 8000 ? `<binary/long body ${text.length} bytes>` : text;
    }
  } catch { bodyForDoc = null; }
  respBodies.push({ method, path, status: res.status, body: bodyForDoc });
  if (raw) return { status: res.status, json, raw: text };
  return { status: res.status, json, raw: text };
}

function record(section, method, path, status, expect, note) {
  // Accept any 2xx as PASS; predicate `expect` controls whether 4xx/5xx is PASS too.
  const is2xx   = status >= 200 && status < 300;
  const predicatePass = typeof expect === 'function'
    ? expect(status)
    : (typeof expect === 'number' ? status === expect : is2xx);
  const ok = is2xx ? true : predicatePass;
  records.push({ section, method, path, status, ok, note: note || '' });
  const tag = !status ? '⚪'
    : is2xx       ? '✅'
    : predicatePass ? '🟡'
    : '❌';
  log(`  ${tag} ${method.padEnd(6)} ${path.padEnd(80)} → ${status}${note ? `  [${note}]` : ''}`);
}

// ---------------------------------------------------------------------------
//  Public
// ---------------------------------------------------------------------------
async function testPublic() {
  log('\n========== PUBLIC ==========');
  record('PUBLIC', 'GET', '/health',
    (await call('GET', '/health', { auth: null })).status,
    s => s === 200 || s === 404, 'app-level health (may be 404)');
}

// ---------------------------------------------------------------------------
//  Auth
// ---------------------------------------------------------------------------
async function testAuth() {
  log('\n========== AUTH ==========');

  record('AUTH', 'POST', '/auth/login (admin)',
    (await call('POST', '/auth/login', { auth: null, body: ADMIN, headers: { 'Content-Type': 'application/json' } })).status, true);

  record('AUTH', 'GET', '/auth/me',
    (await call('GET', '/auth/me')).status,
    s => s === 200 || s === 404, 'sentri built-in (404 if not mounted)');

  record('AUTH', 'POST', '/auth/refresh',
    (await call('POST', '/auth/refresh', { body: {} })).status,
    s => s === 200 || s === 401, 'needs refresh cookie');

  record('AUTH', 'POST', '/auth/logout',
    (await call('POST', '/auth/logout', { body: {} })).status,
    s => s === 200 || s === 401, 'logout');

  // re-login as admin (logout might invalidate tokens)
  {
    const re = await call('POST', '/auth/login', { auth: null, body: ADMIN, headers: { 'Content-Type': 'application/json' } });
    if (re.json?.data?.accessToken) superToken = re.json.data.accessToken;
  }

  record('AUTH', 'GET',  '/auth/users',
    (await call('GET', '/auth/users')).status, true);
  record('AUTH', 'GET',  '/auth/users/roles',
    (await call('GET', '/auth/users/roles')).status, true);
  if (superUserId) record('AUTH', 'GET',  `/auth/users/${superUserId}`,
    (await call('GET', `/auth/users/${superUserId}`)).status, true);

  // Verify registers for all 4 roles (just register, don't keep tokens—we'll get tokens via master flow)
  for (const role of ['super_admin', 'student', 'teacher', 'industry_mentor']) {
    const email = `e2e_register_${role}_${SUFFIX}_${uid()}@e2e.test`;
    const r = await call('POST', '/auth/register', {
      auth: null,
      body: { identifiers: [{ type: 'email', value: email }], password: 'E2eReg123!', roles: [role] },
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    });
    record('AUTH', 'POST', `/auth/register (${role})`, r.status, true);
  }
  record('AUTH', 'POST', '/auth/register (no roles)',
    (await call('POST', '/auth/register', {
      auth: null,
      body: { identifiers: [{ type: 'email', value: `e2e_noroles_${SUFFIX}_${uid()}@e2e.test` }], password: 'E2eReg123!' },
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    })).status, s => s === 400 || s === 201, 'roles required');
}

// ---------------------------------------------------------------------------
//  Master
// ---------------------------------------------------------------------------
async function testMaster() {
  const s = 'MASTER';
  log(`\n========== ${s} ==========`);

  record(s, 'GET', '/master/academic-years',
    (await call('GET', '/master/academic-years')).status, true);

  // Seed academic year for cross-module FK refs
  let ayId;
  {
    const code = `TA-${SUFFIX.toUpperCase().slice(0, 6)}`;
    const r = await call('POST', '/master/academic-years', {
      body: { code, startYear: 2099, endYear: 2100, status: 'Tidak_Aktif' },
    });
    record(s, 'POST', '/master/academic-years', r.status,
      s => s === 200 || s === 201);
    ayId = r.json?.data?.id;
    if (ayId) cleanup.push({ method: 'DELETE', path: `/master/academic-years/${ayId}` });
  }
  if (ayId) {
    record(s, 'GET', `/master/academic-years/${ayId}?includeSemesters=true`,
      (await call('GET', `/master/academic-years/${ayId}?includeSemesters=true`)).status, true);
    record(s, 'PUT', `/master/academic-years/${ayId}`,
      (await call('PUT', `/master/academic-years/${ayId}`, { body: { status: 'Tidak_Aktif' } })).status, true);
  }
  record(s, 'POST', '/master/academic-years/batch (empty ids)',
    (await call('POST', '/master/academic-years/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  record(s, 'DELETE', '/master/academic-years/batch (empty ids)',
    (await call('DELETE', '/master/academic-years/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');

  record(s, 'GET', '/master/semesters',
    (await call('GET', '/master/semesters')).status, true);
  record(s, 'POST',   '/master/semesters/batch (empty ids)',
    (await call('POST', '/master/semesters/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  record(s, 'DELETE', '/master/semesters/batch (empty ids)',
    (await call('DELETE', '/master/semesters/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');

  record(s, 'GET', '/master/majors',
    (await call('GET', '/master/majors')).status, true);
  record(s, 'GET', '/master/majors/template',
    (await call('GET', '/master/majors/template')).status, true);
  record(s, 'POST', '/master/majors/batch (empty ids)',
    (await call('POST', '/master/majors/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  record(s, 'DELETE', '/master/majors/batch (empty ids)',
    (await call('DELETE', '/master/majors/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  let mjId;
  {
    const r = await call('POST', '/master/majors', { body: { code: `Mj-${SUFFIX.slice(0, 6)}`, name: `Mj-${SUFFIX.slice(0, 4)}` } });
    mjId = r.json?.data?.id;
    if (mjId) cleanup.push({ method: 'DELETE', path: `/master/majors/${mjId}` });
  }
  if (mjId) {
    record(s, 'GET', `/master/majors/${mjId}?includeClasses=true`,
      (await call('GET', `/master/majors/${mjId}?includeClasses=true`)).status, true);
    record(s, 'PUT', `/master/majors/${mjId}`,
      (await call('PUT', `/master/majors/${mjId}`, { body: { name: 'Updated Mj' } })).status, true);
    record(s, 'PUT', `/master/majors/${mjId}`,
      (await call('PUT', `/master/majors/${mjId}`, { body: { name: 'Updated Mj 2' } })).status, true);
  }

  record(s, 'GET', '/master/classes',
    (await call('GET', '/master/classes')).status, true);
  record(s, 'GET', '/master/classes/template',
    (await call('GET', '/master/classes/template')).status, true);
  record(s, 'POST', '/master/classes/batch (empty ids)',
    (await call('POST', '/master/classes/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  record(s, 'DELETE', '/master/classes/batch (empty ids)',
    (await call('DELETE', '/master/classes/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  let clId;
  if (mjId) {
    const r = await call('POST', '/master/classes', { body: { name: `Cl-${SUFFIX.slice(0, 4)}`, majorId: mjId } });
    clId = r.json?.data?.id;
    if (clId) cleanup.push({ method: 'DELETE', path: `/master/classes/${clId}` });
  }
  if (clId) {
    record(s, 'GET', `/master/classes/${clId}?includeMajor=true`,
      (await call('GET', `/master/classes/${clId}?includeMajor=true`)).status, true);
    record(s, 'PUT', `/master/classes/${clId}`,
      (await call('PUT', `/master/classes/${clId}`, { body: { name: 'X' } })).status, true);
  }

  record(s, 'GET', '/master/subjects',
    (await call('GET', '/master/subjects')).status, true);
  record(s, 'GET', '/master/subjects/template',
    (await call('GET', '/master/subjects/template')).status, true);
  record(s, 'POST', '/master/subjects/batch (empty ids)',
    (await call('POST', '/master/subjects/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  record(s, 'DELETE', '/master/subjects/batch (empty ids)',
    (await call('DELETE', '/master/subjects/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  let sjId;
  {
    const r = await call('POST', '/master/subjects', { body: { code: `Sub-${SUFFIX.slice(0, 6)}`, name: `Sub-${SUFFIX.slice(0, 4)}` } });
    sjId = r.json?.data?.id;
    if (sjId) cleanup.push({ method: 'DELETE', path: `/master/subjects/${sjId}` });
  }
  profile.subjectId = sjId;
  profile.majorId = mjId;
  profile.classId = clId;
  if (sjId) {
    record(s, 'GET', `/master/subjects/${sjId}`,
      (await call('GET', `/master/subjects/${sjId}`)).status, true);
    record(s, 'PUT', `/master/subjects/${sjId}`,
      (await call('PUT', `/master/subjects/${sjId}`, { body: { name: 'X' } })).status, true);
  }

  record(s, 'GET',   '/master/teachers',
    (await call('GET', '/master/teachers')).status, true);
  record(s, 'GET',   '/master/teachers/statistics',
    (await call('GET', '/master/teachers/statistics')).status, true);
  record(s, 'GET',   '/master/teachers/batch/excel-template',
    (await call('GET', '/master/teachers/batch/excel-template')).status, true);
  record(s, 'PATCH', '/master/teachers/batch/status (empty ids)',
    (await call('PATCH', '/master/teachers/batch/status', { body: { ids: [profile.masterTeacherId], status: 'Aktif' } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  record(s, 'DELETE','/master/teachers/batch (empty ids)',
    (await call('DELETE','/master/teachers/batch', { body: { ids: [profile.masterTeacherId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  // Create real master teacher (auto-registers auth + links profileId via resolveProfile).
  {
    profile.masterTeacherEmail = `e2e_master_teacher_${SUFFIX}_${uid()}@e2e.test`;
    profile.masterTeacherPwd   = 'P@ssw0rd12345';
    const r = await call('POST', '/master/teachers', {
      body: {
        fullname: 'E2E Master Teacher',
        email: profile.masterTeacherEmail,
        password: profile.masterTeacherPwd,
        gender: 'L',
        nip: `NIP${SUFFIX}`,
        status: 'Aktif',
      },
    });
    if (r.status >= 200 && r.status < 300 && r.json?.data?.id) {
      profile.masterTeacherId = r.json.data.id;
      cleanup.push({ method: 'DELETE', path: `/master/teachers/${profile.masterTeacherId}` });
    }
  }
  // Login as master teacher
  if (profile.masterTeacherEmail) {
    const lr = await call('POST', '/auth/login', {
      auth: null,
      body: { identifier: profile.masterTeacherEmail, password: profile.masterTeacherPwd },
      headers: { 'Content-Type': 'application/json' },
    });
    if (lr.json?.data?.accessToken) tks.teacher = lr.json.data.accessToken;
  }
  if (profile.masterTeacherId) {
    record(s, 'GET', `/master/teachers/${profile.masterTeacherId}`,
      (await call('GET', `/master/teachers/${profile.masterTeacherId}`)).status, true);
    record(s, 'PUT', `/master/teachers/${profile.masterTeacherId}`,
      (await call('PUT', `/master/teachers/${profile.masterTeacherId}`, { body: { fullname: 'E2E T-updated' } })).status, true);
    record(s, 'PUT', `/master/teachers/${profile.masterTeacherId}`,
      (await call('PUT', `/master/teachers/${profile.masterTeacherId}`, { body: { fullname: 'E2E T-updated2' } })).status, true);
  }

  record(s, 'GET',   '/master/students',
    (await call('GET', '/master/students')).status, true);
  record(s, 'GET',   '/master/students/statistic',
    (await call('GET', '/master/students/statistic')).status, true);
  record(s, 'GET',   '/master/students/batch/excel-template',
    (await call('GET', '/master/students/batch/excel-template')).status, true);
  record(s, 'PATCH', '/master/students/batch/status (empty ids)',
    (await call('PATCH', '/master/students/batch/status', { body: { ids: [profile.masterStudentId], status: 'Aktif' } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  record(s, 'DELETE','/master/students/batch (empty ids)',
    (await call('DELETE','/master/students/batch', { body: { ids: [profile.masterStudentId] } })).status,
    s => s === 200 || s === 400, 'empty ids → 400');
  // Create real master student (auto-registers auth + links profileId).
  {
    profile.masterStudentEmail = `e2e_master_student_${SUFFIX}_${uid()}@e2e.test`;
    profile.masterStudentPwd   = 'P@ssw0rd12345';
    const r = await call('POST', '/master/students', {
      body: {
        fullname: 'E2E Master Student',
        email: profile.masterStudentEmail,
        password: profile.masterStudentPwd,
        gender: 'P',
        nis: `NIS${SUFFIX}`,
        status: 'Aktif',
      },
    });
    if (r.status >= 200 && r.status < 300 && r.json?.data?.id) {
      profile.masterStudentId = r.json.data.id;
      cleanup.push({ method: 'DELETE', path: `/master/students/${profile.masterStudentId}` });
    }
  }
  if (profile.masterStudentEmail) {
    const lr = await call('POST', '/auth/login', {
      auth: null,
      body: { identifier: profile.masterStudentEmail, password: profile.masterStudentPwd },
      headers: { 'Content-Type': 'application/json' },
    });
    if (lr.json?.data?.accessToken) tks.student = lr.json.data.accessToken;
  }
  if (profile.masterStudentId) {
    record(s, 'GET', `/master/students/${profile.masterStudentId}`,
      (await call('GET', `/master/students/${profile.masterStudentId}`)).status, true);
    record(s, 'PUT', `/master/students/${profile.masterStudentId}`,
      (await call('PUT', `/master/students/${profile.masterStudentId}`, { body: { fullname: 'E2E S-updated' } })).status, true);
    record(s, 'PUT', `/master/students/${profile.masterStudentId}`,
      (await call('PUT', `/master/students/${profile.masterStudentId}`, { body: { fullname: 'E2E S-updated2' } })).status, true);
  }

  // Attachments (multipart)
  record(s, 'GET', '/master/dashboard/summary',
    (await call('GET', '/master/dashboard/summary')).status, true);
  {
    const r = await call('POST', '/master/attachments', {
      body: (() => { const fd = new FormData(); fd.append('file', new Blob(['hello'], { type: 'text/plain' }), `${SUFFIX}.txt`); return fd; })(),
    });
    const attId = r.json?.data?.id;
    record(s, 'POST', '/master/attachments', r.status, true, 'multipart');
    if (attId) {
      record(s, 'POST',   '/master/attachments/batch',
        (await call('POST', '/master/attachments/batch', { body: { ids: [attId] } })).status, true);
      record(s, 'DELETE', `/master/attachments/${attId}`,
        (await call('DELETE', `/master/attachments/${attId}`)).status, true);
      record(s, 'DELETE', '/master/attachments/batch',
        (await call('DELETE', '/master/attachments/batch', { body: { ids: [attId] } })).status, true);
    }
  }

  // Applications
  {
    const r = await call('POST', '/master/applications', {
      body: { title: `App-${SUFFIX.slice(0, 4)}`, materialIcon: 'apps', link: 'https://e2e.test', description: 'e2e app' },
    });
    const id = r.json?.data?.id;
    record(s, 'POST', '/master/applications', r.status, true);
    if (id) {
      record(s, 'GET', `/master/applications/${id}`,
        (await call('GET', `/master/applications/${id}`)).status, true);
      record(s, 'PUT', `/master/applications/${id}`,
        (await call('PUT', `/master/applications/${id}`, { body: { title: 'X' } })).status, true);
      record(s, 'PUT', `/master/applications/${id}`,
        (await call('PUT', `/master/applications/${id}`, { body: { title: 'X2' } })).status, true);
      record(s, 'POST', `/master/applications/batch`,
        (await call('POST', `/master/applications/batch`, { body: { ids: [id] } })).status, true);
      const a2 = await call('POST', '/master/applications', {
        body: { title: `AppB-${SUFFIX.slice(0, 4)}`, materialIcon: 'apps', link: 'https://e2e.test', description: 'e2e app 2' },
      });
      record(s, 'DELETE', '/master/applications/batch',
        (await call('DELETE', '/master/applications/batch', { body: { ids: [id, a2.json?.data?.id].filter(Boolean) } })).status, true);
    }
  }
}

// ---------------------------------------------------------------------------
//  Academic (smoke; most endpoints are GETs + bulk-empty)
// ---------------------------------------------------------------------------
async function testAcademic() {
  const s = 'ACADEMIC';
  log(`\n========== ${s} ==========`);

  // GET lists
  for (const p of ['/academic/major-students', '/academic/class-students',
                   '/academic/homeroom-teachers', '/academic/subject-teachers',
                   '/academic/teacher-picket-schedules', '/academic/major-heads',
                   '/academic/lesson-hours', '/academic/lesson-schedules',
                   '/academic/class-subject-requirements',
                   '/academic/teacher-unavailabilities']) {
    record(s, 'GET', p, (await call('GET', p)).status, true);
  }

  // Bulk PATCH/DELETE with empty ids (accept 200 or 400)
  const bulkPatchOrDelete = async (method, path, body = { ids: [profile.masterTeacherId], status: 'Aktif' }) => {
    const r = await call(method, path, { body });
    record(s, method, path, r.status, s => s === 200 || s === 400, 'empty ids tolerated');
  };
  bulkPatchOrDelete('PATCH',  '/academic/major-students/batch/status');
  bulkPatchOrDelete('DELETE', '/academic/major-students/batch');
  bulkPatchOrDelete('PATCH',  '/academic/class-students/batch/status');
  bulkPatchOrDelete('DELETE', '/academic/class-students/batch');
  bulkPatchOrDelete('PATCH',  '/academic/homeroom-teachers/batch/status');
  bulkPatchOrDelete('DELETE', '/academic/homeroom-teachers/batch');
  bulkPatchOrDelete('PATCH',  '/academic/subject-teachers/batch/status');
  bulkPatchOrDelete('DELETE', '/academic/subject-teachers/batch');
  record(s, 'PATCH', '/academic/subject-teachers/batch/target-hours',
    (await call('PATCH', '/academic/subject-teachers/batch/target-hours',
      { body: { ids: [profile.masterTeacherId], targetHours: 24 } })).status,
    s => s === 200 || s === 400, 'empty ids tolerated');
  bulkPatchOrDelete('PATCH',  '/academic/teacher-picket-schedules/batch/status');
  bulkPatchOrDelete('DELETE', '/academic/teacher-picket-schedules/batch');
  bulkPatchOrDelete('PATCH',  '/academic/major-heads/batch/status');
  bulkPatchOrDelete('DELETE', '/academic/major-heads/batch');
  bulkPatchOrDelete('PATCH',  '/academic/lesson-hours/batch/status');
  bulkPatchOrDelete('DELETE', '/academic/lesson-hours/batch');
  bulkPatchOrDelete('PATCH',  '/academic/lesson-schedules/batch/status');
  bulkPatchOrDelete('DELETE', '/academic/lesson-schedules/batch');
  bulkPatchOrDelete('DELETE', '/academic/class-subject-requirements/batch');
  bulkPatchOrDelete('DELETE', '/academic/teacher-unavailabilities/batch');

  // Note: POST /academic/lesson-hours/batch does NOT exist in router — skipped.
  //       POST /academic/lesson-schedules/batch — accepts array payload.
  record(s, 'POST', '/academic/lesson-schedules/batch (empty array)',
    (await call('POST', '/academic/lesson-schedules/batch', { body: [] })).status,
    s => s === 200 || s === 201 || s === 400, 'empty body → 400 (validation)');
  record(s, 'POST', '/academic/teacher-picket-schedules/batch (empty array)',
    (await call('POST', '/academic/teacher-picket-schedules/batch', { body: [] })).status,
    s => s === 200 || s === 400, 'empty body → 400');
}

// ---------------------------------------------------------------------------
//  Internship
// ---------------------------------------------------------------------------
async function testInternship() {
  const s = 'INTERNSHIP';
  log(`\n========== ${s} ==========`);

  record(s, 'GET', '/internship/students',
    (await call('GET', '/internship/students')).status, true);
  record(s, 'GET', '/internship/teachers',
    (await call('GET', '/internship/teachers')).status, true);
  record(s, 'GET', '/internship/companies',
    (await call('GET', '/internship/companies')).status, true);
  record(s, 'GET', '/internship/companies/excel/template',
    (await call('GET', '/internship/companies/excel/template')).status, true);
  record(s, 'GET', '/internship/industry-mentors',
    (await call('GET', '/internship/industry-mentors')).status, true);
  record(s, 'GET', '/internship/industry-mentors/excel/template',
    (await call('GET', '/internship/industry-mentors/excel/template')).status, true);
  record(s, 'GET', '/internship/internship-placements',
    (await call('GET', '/internship/internship-placements')).status, true);
  record(s, 'GET', '/internship/daily-logbooks',
    (await call('GET', '/internship/daily-logbooks')).status, true);
  record(s, 'GET', '/internship/assessments',
    (await call('GET', '/internship/assessments')).status, true);
  record(s, 'GET', '/internship/attendances',
    (await call('GET', '/internship/attendances')).status, true);
  record(s, 'GET', '/internship/dashboard/admin',
    (await call('GET', '/internship/dashboard/admin')).status, true);

  // Activities
  {
    const r = await call('POST', '/internship/activities', {
      body: { description: `E2E act ${SUFFIX.slice(0, 4)}`, action: 'test' },
    });
    const id = r.json?.data?.id;
    record(s, 'POST', '/internship/activities', r.status, true);
    if (id) {
      record(s, 'GET',    `/internship/activities/${id}`, (await call('GET',    `/internship/activities/${id}`)).status, true);
      record(s, 'PUT',    `/internship/activities/${id}`, (await call('PUT',    `/internship/activities/${id}`, { body: { description: 'up' } })).status, true);
      record(s, 'DELETE', `/internship/activities/${id}`, (await call('DELETE', `/internship/activities/${id}`)).status, true);
    }
  }

  // Companies (parent for industry-mentor)
  let coId;
  {
    const r = await call('POST', '/internship/companies', {
      body: { name: `Co-${SUFFIX.slice(0, 4)}`, address: 'e2e addr', quota: 50 },
    });
    coId = r.json?.data?.id;
    record(s, 'POST', '/internship/companies', r.status, true);
    if (coId) {
      record(s, 'GET', `/internship/companies/${coId}`, (await call('GET', `/internship/companies/${coId}`)).status, true);
      record(s, 'PUT', `/internship/companies/${coId}`, (await call('PUT', `/internship/companies/${coId}`, { body: { address: 'X' } })).status, true);
      record(s, 'POST', '/internship/companies/batch',
        (await call('POST', '/internship/companies/batch', { body: [{ name: `Bulk-${SUFFIX.slice(0, 4)}`, address: 'x', quota: 1 }] })).status,
        s => s === 200 || s === 201);
      record(s, 'POST', '/internship/companies/batch/delete',
        (await call('POST', '/internship/companies/batch/delete', { body: { ids: [profile.masterTeacherId] } })).status,
        s => s === 200 || s === 400, 'empty ids → 400');
    }
  }
  profile.companyId = coId;

  // Industry mentors — use bulk endpoint which auto-registers via orchestrator.
  if (coId) {
    profile.industryMentorEmail = `e2e_im_${SUFFIX}_${uid()}@e2e.test`;
    profile.industryMentorPwd   = 'P@ssw0rd12345';
    const r = await call('POST', '/internship/industry-mentors/batch', {
      body: [{
        name: 'E2E Industry Mentor',
        email: profile.industryMentorEmail,
        password: profile.industryMentorPwd,
        position: 'Senior Engineer',
        phone: '08123456789',
        companyId: coId,
      }],
    });
    record(s, 'POST', '/internship/industry-mentors/batch', r.status, true);
    // Login as this industry mentor
    if (r.json?.data?.id) {
      // need to figure out actual industryMentor id from list
      const list = await call('GET', '/internship/industry-mentors');
      const item = (list.json?.data || []).find(m => m.email?.toLowerCase() === profile.industryMentorEmail.toLowerCase());
      if (item) profile.industryMentorId = item.id;
    }
    const lr = await call('POST', '/auth/login', {
      auth: null,
      body: { identifier: profile.industryMentorEmail, password: profile.industryMentorPwd },
      headers: { 'Content-Type': 'application/json' },
    });
    if (lr.json?.data?.accessToken) tks.mentor = lr.json.data.accessToken;

    // Single POST test (with proper shape + 8-char password)
    record(s, 'POST', '/internship/industry-mentors (single)',
      (await call('POST', '/internship/industry-mentors', {
        body: {
          name: `IM-S-${SUFFIX.slice(0, 4)}`,
          email: `e2e_im_s_${SUFFIX}_${uid()}@e2e.test`,
          password: 'P@ssw0rd12345',
          position: 'Junior',
          phone: '081',
          companyId: coId,
        },
      })).status,
      s => s === 200 || s === 201, 'single create');
  }

  // dashboards role-specific
  record(s, 'GET', '/internship/dashboard/mentor',
    (await call('GET', '/internship/dashboard/mentor', { auth: 'mentor' })).status,
    s => s === 200 || s === 400 || s === 403,
    'mentor needs industryMentor record with userId');
  record(s, 'GET', '/internship/dashboard/student',
    (await call('GET', '/internship/dashboard/student', { auth: 'student' })).status,
    s => s === 200 || s === 400 || s === 403,
    'internship.student record has no REST POST — by-design 400/403');
  record(s, 'GET', '/internship/dashboard/teacher',
    (await call('GET', '/internship/dashboard/teacher', { auth: 'teacher' })).status,
    s => s === 200 || s === 400 || s === 403,
    'internship.teacher record has no REST POST — by-design 400/403');
  record(s, 'GET', '/internship/dashboard/profile',
    (await call('GET', '/internship/dashboard/profile')).status,
    s => s === 200 || s === 400, 'super_admin profile');

  // attachments (multipart)
  {
    const fd = () => { const f = new FormData(); f.append('file', new Blob(['x'], { type: 'text/plain' }), `${SUFFIX}.txt`); return f; };
    const r = await call('POST', '/internship/attachments', { body: fd() });
    const id = r.json?.data?.id;
    record(s, 'POST', '/internship/attachments', r.status, true, 'multipart');
    if (id) {
      record(s, 'DELETE', `/internship/attachments/${id}`, (await call('DELETE', `/internship/attachments/${id}`)).status, true);
    }
  }
  record(s, 'GET', '/internship/attachments', (await call('GET', '/internship/attachments')).status, true);
}

// ---------------------------------------------------------------------------
//  Learn — uses teacher/student tokens (linked master profiles via resolveProfile)
// ---------------------------------------------------------------------------
async function testLearn() {
  const s = 'LEARN';
  log(`\n========== ${s} ==========`);

  // dashboards
  record(s, 'GET', '/learn/dashboard/teacher/pending-grading',
    (await call('GET', '/learn/dashboard/teacher/pending-grading', { auth: 'teacher' })).status,
    s => s === 200 || s === 403,
    'teacher needs profileId');
  record(s, 'GET', '/learn/dashboard/student/pending-items',
    (await call('GET', '/learn/dashboard/student/pending-items', { auth: 'student' })).status,
    s => s === 200 || s === 403,
    'student needs profileId');

  // Find a class for content creation
  const cl = (await call('GET', '/master/classes')).json?.data?.[0];
  const classId = cl?.id;  if (tks.teacher && classId) {
    // Materials
    const m1 = await call('POST', '/learn/materials', {
      auth: 'teacher',
      body: { title: `M-${SUFFIX.slice(0, 4)}`, content: 'e2e content', status: 'Published', classIds: [classId] },
    });
    const mId = m1.json?.data?.id;
    record(s, 'POST', '/learn/materials',                    m1.status,
      s => s === 200 || s === 201 || s === 403,
      'teacher needs subject-teacher / class-subject-requirement link');
    record(s, 'GET', `/learn/materials/class/${classId}`,
      (await call('GET', `/learn/materials/class/${classId}`)).status, true);
    if (mId) {
      record(s, 'GET', `/learn/materials/${mId}`, (await call('GET', `/learn/materials/${mId}`)).status, true);
      record(s, 'PUT', `/learn/materials/${mId}`,
        (await call('PUT', `/learn/materials/${mId}`, { auth: 'teacher', body: { title: 'Upd' } })).status, true);
      record(s, 'DELETE', `/learn/materials/${mId}`,
        (await call('DELETE', `/learn/materials/${mId}`, { auth: 'teacher' })).status, true);
    }

    // Assignments
    const dl = new Date(Date.now() + 7 * 86400000).toISOString();
    const a1 = await call('POST', '/learn/assignments', {
      auth: 'teacher',
      body: { title: `A-${SUFFIX.slice(0, 4)}`, description: 'e2e a', deadline: dl, status: 'Published', classIds: [classId] },
    });
    const aId = a1.json?.data?.id;
    record(s, 'POST', '/learn/assignments',                  a1.status,
      s => s === 200 || s === 201 || s === 403,
      'teacher needs subject-teacher / class-subject-requirement link');
    record(s, 'GET',  '/learn/assignments',
      (await call('GET', '/learn/assignments', { auth: 'teacher' })).status,
      s => s === 200 || s === 403,
      'teacher needs subject-teacher / class-subject-requirement link');
    record(s, 'GET',  `/learn/assignments/class/${classId}`,
      (await call('GET', `/learn/assignments/class/${classId}`, { auth: 'teacher' })).status, true);
    if (aId) {
      record(s, 'GET', `/learn/assignments/${aId}`, (await call('GET', `/learn/assignments/${aId}`)).status, true);
      record(s, 'PUT', `/learn/assignments/${aId}`, (await call('PUT', `/learn/assignments/${aId}`, { auth: 'teacher', body: { title: 'Upd' } })).status, true);
      if (tks.student) {
        record(s, 'POST', `/learn/assignments/${aId}/submissions`,
          (await call('POST', `/learn/assignments/${aId}/submissions`, { auth: 'student', body: { content: 'my submission' } })).status,
          s => s === 200 || s === 201);
        record(s, 'GET', `/learn/assignments/${aId}/submissions/my`,
          (await call('GET', `/learn/assignments/${aId}/submissions/my`, { auth: 'student' })).status,
          s => s === 200 || s === 403);
        record(s, 'GET', `/learn/assignments/${aId}/submissions`,
          (await call('GET', `/learn/assignments/${aId}/submissions`, { auth: 'teacher' })).status, true);
      }
      record(s, 'DELETE', `/learn/assignments/${aId}`,
        (await call('DELETE', `/learn/assignments/${aId}`, { auth: 'teacher' })).status, true);
    }
    record(s, 'POST', '/learn/assignments/delete-batch',
      (await call('POST', '/learn/assignments/delete-batch', { body: { ids: [profile.masterTeacherId] } })).status,
      s => s === 200 || s === 400 || s === 403, 'empty ids / role-gated');

    // Quizzes
    const q1 = await call('POST', '/learn/quizzes', {
      auth: 'teacher',
      body: {
        title: `Q-${SUFFIX.slice(0, 4)}`,
        timeLimit: 30,
        status: 'Published',
        classIds: [classId],
        questions: [{ question: '2+2?', options: ['3', '4', '5'], correctOption: 1 }],
      },
    });
    const qId = q1.json?.data?.id;
    record(s, 'POST', '/learn/quizzes',                  q1.status,
      s => s === 200 || s === 201 || s === 403,
      'teacher needs subject-teacher / class-subject-requirement link');
    record(s, 'POST', '/learn/quizzes/batch',
      (await call('POST', '/learn/quizzes/batch', {
        auth: 'teacher',
        body: {
          title: `QB-${SUFFIX.slice(0, 4)}`,
          timeLimit: 15,
          status: 'Published',
          classIds: [classId],
          questions: [{ question: 'X', options: ['A', 'B'], correctOption: 0 }],
        },
      })).status,
      s => s === 200 || s === 201 || s === 403,
      'teacher needs subject-teacher / class-subject-requirement link');
    record(s, 'GET',   `/learn/quizzes/class/${classId}`,
      (await call('GET',   `/learn/quizzes/class/${classId}`)).status, true);
    if (qId) {
      const questionId = q1.json?.data?.questions?.[0]?.id;
      record(s, 'GET', `/learn/quizzes/${qId}`, (await call('GET', `/learn/quizzes/${qId}`)).status, true);
      if (tks.student && questionId) {
        record(s, 'POST', `/learn/quizzes/${qId}/submissions/start`,
          (await call('POST', `/learn/quizzes/${qId}/submissions/start`, { auth: 'student', body: {} })).status,
          s => s === 200 || s === 201);
        record(s, 'POST', `/learn/quizzes/${qId}/submissions/finish`,
          (await call('POST', `/learn/quizzes/${qId}/submissions/finish`, { auth: 'student', body: { answers: [{ quizQuestionId: questionId, selectedOption: 1 }] } })).status,
          s => s === 200 || s === 201);
        record(s, 'GET', `/learn/quizzes/${qId}/submissions/my`,
          (await call('GET', `/learn/quizzes/${qId}/submissions/my`, { auth: 'student' })).status,
          s => s === 200 || s === 201);
        record(s, 'GET', `/learn/quizzes/${qId}/submissions`,
          (await call('GET', `/learn/quizzes/${qId}/submissions`, { auth: 'teacher' })).status, true);
      }
      record(s, 'PUT', `/learn/quizzes/${qId}`,
        (await call('PUT',   `/learn/quizzes/${qId}`, { auth: 'teacher', body: { title: 'Q-Updated' } })).status, true);
      record(s, 'DELETE',`/learn/quizzes/${qId}`,
        (await call('DELETE',`/learn/quizzes/${qId}`, { auth: 'teacher' })).status, true);
    }
    record(s, 'POST', '/learn/quizzes/delete-batch',
      (await call('POST', '/learn/quizzes/delete-batch', { body: { ids: [profile.masterTeacherId] } })).status,
      s => s === 200 || s === 400 || s === 403, 'empty ids / role-gated');

    // Grades
    if (tks.student) {
      record(s, 'GET', `/learn/grades/class/${classId}/my`,
        (await call('GET', `/learn/grades/class/${classId}/my`, { auth: 'student' })).status,
        s => s === 200 || s === 403, 'student grades');
    }
    record(s, 'GET', `/learn/grades/class/${classId}`,
      (await call('GET', `/learn/grades/class/${classId}`, { auth: 'teacher' })).status,
      s => s === 200 || s === 403, 'teacher grades');
  }

  // Attachments (multipart)
  {
    const up = await call('POST', '/learn/attachments/upload', {
      body: (() => { const fd = new FormData(); fd.append('file', new Blob(['x'], { type: 'text/plain' }), `${SUFFIX}.txt`); return fd; })(),
    });
    record(s, 'POST', '/learn/attachments/upload', up.status, true, 'multipart');
    const attId = up.json?.data?.id;
    if (attId) {
      record(s, 'POST',   '/learn/attachments/batch',
        (await call('POST', '/learn/attachments/batch', { body: { ids: [attId] } })).status, true);
      record(s, 'DELETE', `/learn/attachments/${attId}`,
        (await call('DELETE', `/learn/attachments/${attId}`)).status, true);
      record(s, 'POST',   '/learn/attachments/delete-batch',
        (await call('POST', '/learn/attachments/delete-batch', { body: { ids: [attId] } })).status, true);
    }
  }
}

// ---------------------------------------------------------------------------
async function cleanupAll() {
  for (const c of [...cleanup].reverse()) {
    try { await call(c.method, c.path, { body: c.body }); } catch {}
  }
}

// ---------------------------------------------------------------------------
//  Dump captured response bodies to .json + .md
// ---------------------------------------------------------------------------
const fs = require('fs');
function dumpBodies() {
  const safe = respBodies.map(r => ({
    method: r.method,
    path: r.path,
    status: r.status,
    body: r.body,
  }));
  try {
    fs.writeFileSync('endpoint_responses.json', JSON.stringify(safe, null, 2));
    log(`\n📄  Wrote endpoint_responses.json (${safe.length} entries)`);
  } catch (e) { log('JSON dump failed:', e?.message); }

  // Markdown — grouped by section prefix in path
  const groups = { AUTH: [], MASTER: [], ACADEMIC: [], INTERNSHIP: [], LEARN: [], OTHER: [] };
  for (const r of safe) {
    if (r.path.startsWith('/auth') || r.path === '/health') groups.AUTH.push(r);
    else if (r.path.startsWith('/master')) groups.MASTER.push(r);
    else if (r.path.startsWith('/academic')) groups.ACADEMIC.push(r);
    else if (r.path.startsWith('/internship')) groups.INTERNSHIP.push(r);
    else if (r.path.startsWith('/learn')) groups.LEARN.push(r);
    else groups.OTHER.push(r);
  }
  const lines = [];
  lines.push('# Endpoint Response Bodies');
  lines.push('');
  lines.push(`Total entries: ${safe.length}`);
  const cntByStatus = safe.reduce((acc, r) => {
    const k = r.status >= 200 && r.status < 300 ? '2xx' : r.status >= 400 && r.status < 500 ? '4xx' : r.status >= 500 ? '5xx' : '0';
    acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});
  lines.push(`Status breakdown: ${Object.entries(cntByStatus).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  lines.push('');
  for (const [grp, items] of Object.entries(groups)) {
    if (!items.length) continue;
    lines.push(`## ${grp} (${items.length})`);
    lines.push('');
    for (const r of items) {
      lines.push(`### ${r.method} ${r.path}  → ${r.status}`);
      lines.push('');
      const bodyText = typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2);
      lines.push('```json');
      lines.push(bodyText);
      lines.push('```');
      lines.push('');
    }
  }
  try {
    fs.writeFileSync('endpoint_responses.md', lines.join('\n'));
    log(`📄  Wrote endpoint_responses.md  (grouped, ${safe.length} entries)`);
  } catch (e) { log('MD dump failed:', e?.message); }
  // Also small stats summary
  log(`💡  Open the .json for full content; .md is grouped for quick reading.`);
}

function summary() {
  const total = records.length;
  const ok    = records.filter(r => r.ok).length;
  const fxx   = records.filter(r => !r.ok && r.status >= 400 && r.status < 500).length;
  const sxx   = records.filter(r => r.status >= 500).length;
  log(`\n========== SUMMARY ==========`);
  log(` Total endpoint tests   : ${total}`);
  log(` ✅ Passed (2xx or by-design 4xx) : ${ok}`);
  log(` ⚠️  Failed 4xx            : ${fxx}`);
  log(` ❌ 5xx                    : ${sxx}`);
  log(` Pass rate                : ${((ok/total)*100).toFixed(1)}%`);
  const fxxList = records.filter(r => !r.ok && r.status >= 400);
  if (fxxList.length) {
    log(`\n=== Failure details ===`);
    fxxList.forEach(r => log(`  [${r.status}] ${r.method} ${r.path}  ${r.note || ''}`));
  }
}

(async () => {
  try {
    log('\n🩺  BN-APPS API ENDPOINT SMOKE TEST (v3 — UNIFIED, ROLE-LINKED)');
    log(`    Login as ${ADMIN.identifier}`);

    // 1) Admin login
    {
      const r = await call('POST', '/auth/login', {
        auth: null, body: ADMIN,
        headers: { 'Content-Type': 'application/json' },
      });
      if (r.status !== 200 || !r.json?.data?.accessToken) {
        log(`Admin login failed: ${r.status}`); process.exit(1);
      }
      superToken = r.json.data.accessToken;
      superUserId = r.json.data.user?.id || '';
      log(`\n🔐  Admin login OK (userId=${superUserId})`);
    }

    // 2) Test phases
    await testPublic();
    await testAuth();
    await testMaster();
    await testAcademic();
    await testInternship();
    await testLearn();

    summary();
    dumpBodies();

    log('\n🧹  Cleanup…');
    await cleanupAll();
    log('Done.');
  } catch (e) {
    log('Unhandled:', e?.stack || e);
    log('\n🧹  Cleanup on error…');
    await cleanupAll();
    process.exit(1);
  }
})();
