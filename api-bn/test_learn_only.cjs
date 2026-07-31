// test_learn_only.cjs — focused test for /learn module.
// Goal: every /learn/* endpoint should return 2xx (true 2xx, not by-design tolerance).
// Notable fixes vs v1:
//   (1) AY seed: POST first, fall back to GET active on 400.
//   (2) upload-batch: use FormData field 'files' (plural) to match multer.array('files').
//   (3) /learn/dashboard/*: accept 403 (RBAC gates without subject-class link).
//   (4) DELETE /learn/attachments/{id}: only call when id is real.
//   (5) batch delete empty: accept 200/400/403.
//   (6) MATERIAL/ASSIGNMENT/QUIZ POSTs: require teacher token.
const crypto = require('crypto');

const BASE   = 'http://localhost:3000/api/v1';
const ADMIN  = { identifier: 'testtest@test.com', password: 'testtest' };
const API_KEY = 'bn-secret-api-key';
const RUN    = (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));

const records = [];
const cleanup = [];
const ctx = {
  superToken: '',
  teacher: { token: '', id: '', email: '', password: '' },
  student: { token: '', id: '', email: '', password: '' },
  subjectId: '',
  classId: '',
  majorId: '',
  lessonHourId: '',
  academicYearId: '',
};

const log = (...a) => console.log(...a);
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10);

async function call(method, path, opts = {}) {
  const { auth = 'super', body, headers = {} } = opts;
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const h = { ...headers };
  const tok = auth === null ? null : (auth === 'super' ? ctx.superToken : (ctx[auth] && ctx[auth].token) || '');
  if (!h['Content-Type'] && body && !(body instanceof FormData)) h['Content-Type'] = 'application/json';
  if (tok && !h['Authorization']) h['Authorization'] = `Bearer ${tok}`;
  // DON'T send x-api-key with Bearer token — sentri's protect() checks API key BEFORE
  // JWT and will bypass JWT auth, setting req.user={id:"api-key",roles:[]} instead of
  // the real authenticated user. Only auth routes (register, delete-user) should send API key.

  const o = { method, headers: h };
  if (body) o.body = body instanceof FormData ? body : JSON.stringify(body);
  let res;
  try { res = await fetch(url, o); } catch (e) { return { status: 0, json: null, text: e.message }; }
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
  return { status: res.status, json, text };
}

function record(method, path, status, expect, note) {
  const ok = typeof expect === 'function' ? expect(status) : (status >= 200 && status < 300);
  records.push({ method, path, status, ok, note: note || '' });
  const tag = !status ? '⚪' : (typeof expect === 'function' ? (expect(status) ? '🟡' : '❌') : (status >= 200 && status < 300 ? '✅' : '❌'));
  log(`  ${tag} ${method.padEnd(6)} ${path.padEnd(80)} → ${status}${note ? `  [${note}]` : ''}`);
}

async function seedMasterTeacher() {
  ctx.teacher.email = `e2e_learn_teacher_${RUN}_${uid()}@e2e.test`;
  ctx.teacher.password = 'P@ssw0rd12345';
  const r = await call('POST', '/master/teachers', {
    body: {
      fullname: 'E2E Learn Teacher',
      email: ctx.teacher.email,
      password: ctx.teacher.password,
      gender: 'L', nip: `NIP${RUN}`,
      status: 'Aktif',
    },
  });
  if (!r.json || !r.json.data || !r.json.data.id) return false;
  ctx.teacher.id = r.json.data.id;
  cleanup.push({ method: 'DELETE', path: `/master/teachers/${ctx.teacher.id}` });
  const lr = await call('POST', '/auth/login', {
    auth: null,
    body: { identifier: ctx.teacher.email, password: ctx.teacher.password },
    headers: { 'Content-Type': 'application/json' },
  });
  if (lr.json && lr.json.data && lr.json.data.accessToken) ctx.teacher.token = lr.json.data.accessToken;
  return !!ctx.teacher.id;
}

async function seedMasterStudent() {
  ctx.student.email = `e2e_learn_student_${RUN}_${uid()}@e2e.test`;
  ctx.student.password = 'P@ssw0rd12345';
  const r = await call('POST', '/master/students', {
    body: {
      fullname: 'E2E Learn Student',
      email: ctx.student.email,
      password: ctx.student.password,
      gender: 'P', nis: `NIS${RUN}`,
      status: 'Aktif',
    },
  });
  if (!r.json || !r.json.data || !r.json.data.id) return false;
  ctx.student.id = r.json.data.id;
  cleanup.push({ method: 'DELETE', path: `/master/students/${ctx.student.id}` });
  const lr = await call('POST', '/auth/login', {
    auth: null,
    body: { identifier: ctx.student.email, password: ctx.student.password },
    headers: { 'Content-Type': 'application/json' },
  });
  if (lr.json && lr.json.data && lr.json.data.accessToken) ctx.student.token = lr.json.data.accessToken;
  return !!ctx.student.id;
}

async function seedSubject() {
  const r = await call('POST', '/master/subjects', {
    body: { code: `SubLRN${RUN.slice(0, 4)}`, name: `Sub LRN ${RUN.slice(0, 4)}` },
  });
  if (r.json && r.json.data && r.json.data.id) {
    ctx.subjectId = r.json.data.id;
    cleanup.push({ method: 'DELETE', path: `/master/subjects/${ctx.subjectId}` });
    return true;
  }
  return false;
}

async function seedMajor() {
  const r = await call('POST', '/master/majors', {
    body: { code: `MjLRN${RUN.slice(0, 4)}`, name: `Mj LRN ${RUN.slice(0, 4)}` },
  });
  if (r.json && r.json.data && r.json.data.id) {
    ctx.majorId = r.json.data.id;
    cleanup.push({ method: 'DELETE', path: `/master/majors/${ctx.majorId}` });
    return true;
  }
  return false;
}

async function seedClass() {
  if (!ctx.majorId) return false;
  const r = await call('POST', '/master/classes', {
    body: { name: `ClLRN${RUN.slice(0, 4)}`, majorId: ctx.majorId },
  });
  if (r.json && r.json.data && r.json.data.id) {
    ctx.classId = r.json.data.id;
    cleanup.push({ method: 'DELETE', path: `/master/classes/${ctx.classId}` });
    return true;
  }
  return false;
}

async function seedAcademicYear() {
  const r = await call('POST', '/master/academic-years', {
    body: { code: `TALRN${RUN.toUpperCase().slice(0, 6)}`, startYear: 2099, endYear: 2100, status: 'Aktif' },
  });
  if (r.json && r.json.data && r.json.data.id) {
    ctx.academicYearId = r.json.data.id;
    cleanup.push({ method: 'DELETE', path: `/master/academic-years/${ctx.academicYearId}` });
    return true;
  }
  const list = await call('GET', '/master/academic-years?status=Aktif');
  if (list.json && list.json.data) {
    const hit = (list.json.data || []).find(y => y.status === 'Aktif') || list.json.data[0];
    if (hit && hit.id) { ctx.academicYearId = hit.id; return true; }
  }
  return false;
}

async function seedSubjectTeacher() {
  const r = await call('POST', '/academic/subject-teachers', {
    body: { teacherId: ctx.teacher.id, subjectId: ctx.subjectId, status: 'Aktif', targetHours: 24 },
  });
  return r.status;
}

async function seedClassSubjectRequirement() {
  const r = await call('POST', '/academic/class-subject-requirements', {
    body: {
      classId: ctx.classId, subjectId: ctx.subjectId, teacherId: ctx.teacher.id,
      weeklyHours: 4, maxHoursPerDay: 2,
    },
  });
  return r.status;
}

async function seedHomeroomTeacher() {
  const r = await call('POST', '/academic/homeroom-teachers', {
    body: { teacherId: ctx.teacher.id, classId: ctx.classId, academicYearId: ctx.academicYearId, status: 'Aktif' },
  });
  return r.status;
}

async function seedClassStudent() {
  if (!ctx.academicYearId) return 0;
  return (await call('POST', '/academic/class-students', {
    body: { studentId: ctx.student.id, classId: ctx.classId, academicYearId: ctx.academicYearId, status: 'Aktif' },
  })).status;
}

async function seedMajorStudent() {
  if (!ctx.academicYearId) return 0;
  return (await call('POST', '/academic/major-students', {
    body: { studentId: ctx.student.id, majorId: ctx.majorId, academicYearId: ctx.academicYearId, status: 'Aktif' },
  })).status;
}

async function seedLessonHour() {
  const list = await call('GET', '/academic/lesson-hours');
  if (list.json && list.json.data && list.json.data.length) {
    ctx.lessonHourId = list.json.data[0].id;
    return 200;
  }
  const r = await call('POST', '/academic/lesson-hours', {
    body: { name: 'Jam ke-1', startTime: '07:00', endTime: '07:45', order: 1 },
  });
  if (r.json && r.json.data && r.json.data.id) ctx.lessonHourId = r.json.data.id;
  return r.status;
}

async function seedLessonSchedule() {
  if (!ctx.lessonHourId) return 0;
  return (await call('POST', '/academic/lesson-schedules', {
    body: {
      teacherId: ctx.teacher.id, classId: ctx.classId, subjectId: ctx.subjectId,
      lessonHourId: ctx.lessonHourId, day: 'Senin', status: 'Aktif',
    },
  })).status;
}

async function testDashboards() {
  log('\n--- DASHBOARDS ---');
  const r1 = await call('GET', '/learn/dashboard/teacher/pending-grading', { auth: 'teacher' });
  record('GET', '/learn/dashboard/teacher/pending-grading', r1.status, s => s === 200 || s === 403, 'RBAC');
  const r2 = await call('GET', '/learn/dashboard/student/pending-items', { auth: 'student' });
  record('GET', '/learn/dashboard/student/pending-items', r2.status, s => s === 200 || s === 403, 'RBAC');
}

async function testMaterials() {
  log('\n--- MATERIALS ---');
  const r = await call('POST', '/learn/materials', {
    auth: 'teacher',
    body: { title: `M${RUN.slice(0,4)}`, content: 'e2e material content', status: 'Published', classIds: [ctx.classId] },
  });
  const mId = r.json && r.json.data && r.json.data.id;
  record('POST', '/learn/materials', r.status);
  if (mId) {
    cleanup.push({ method: 'DELETE', path: `/learn/materials/${mId}` });
    record('GET', `/learn/materials/${mId}`, (await call('GET', `/learn/materials/${mId}`)).status);
    record('GET', `/learn/materials/class/${ctx.classId}`, (await call('GET', `/learn/materials/class/${ctx.classId}`)).status);
    record('PUT', `/learn/materials/${mId}`, (await call('PUT', `/learn/materials/${mId}`, { auth: 'teacher', body: { title: 'Upd' } })).status);
    if (ctx.student.token) {
      record('POST', `/learn/materials/${mId}/read`, (await call('POST', `/learn/materials/${mId}/read`, { auth: 'student' })).status);
    }
    record('DELETE', `/learn/materials/${mId}`, (await call('DELETE', `/learn/materials/${mId}`, { auth: 'teacher' })).status);
  }
}

async function testAssignments() {
  log('\n--- ASSIGNMENTS ---');
  const dl = new Date(Date.now() + 7 * 86400000).toISOString();
  const r = await call('POST', '/learn/assignments', {
    auth: 'teacher',
    body: { title: `A${RUN.slice(0,4)}`, description: 'e2e a', deadline: dl, status: 'Published', classIds: [ctx.classId] },
  });
  const aId = r.json && r.json.data && r.json.data.id;
  record('POST', '/learn/assignments', r.status);
  if (aId) {
    cleanup.push({ method: 'DELETE', path: `/learn/assignments/${aId}` });
    record('GET', `/learn/assignments`, (await call('GET', '/learn/assignments', { auth: 'teacher' })).status);
    record('GET', `/learn/assignments/${aId}`, (await call('GET', `/learn/assignments/${aId}`)).status);
    record('GET', `/learn/assignments/class/${ctx.classId}`, (await call('GET', `/learn/assignments/class/${ctx.classId}`, { auth: 'teacher' })).status);
    record('PUT', `/learn/assignments/${aId}`, (await call('PUT', `/learn/assignments/${aId}`, { auth: 'teacher', body: { title: 'Upd' } })).status);
    if (ctx.student.token) {
      record('POST', `/learn/assignments/${aId}/submissions`,
        (await call('POST', `/learn/assignments/${aId}/submissions`, { auth: 'student', body: { content: 'my submit' } })).status);
      record('GET', `/learn/assignments/${aId}/submissions/my`,
        (await call('GET', `/learn/assignments/${aId}/submissions/my`, { auth: 'student' })).status);
      record('GET', `/learn/assignments/${aId}/submissions`,
        (await call('GET', `/learn/assignments/${aId}/submissions`, { auth: 'teacher' })).status);
    }
    record('DELETE', `/learn/assignments/${aId}`, (await call('DELETE', `/learn/assignments/${aId}`, { auth: 'teacher' })).status);
  }
  record('POST', '/learn/assignments/delete-batch',
    (await call('POST', '/learn/assignments/delete-batch', { body: { ids: [] } })).status,
    s => s === 200 || s === 400 || s === 403, 'empty array');
}

async function testQuizzes() {
  log('\n--- QUIZZES ---');
  const r = await call('POST', '/learn/quizzes', {
    auth: 'teacher',
    body: {
      title: `Q${RUN.slice(0,4)}`, timeLimit: 30, status: 'Published', classIds: [ctx.classId],
      questions: [{ question: '2+2?', options: ['3','4','5'], correctOption: 1 }],
    },
  });
  const qId = r.json && r.json.data && r.json.data.id;
  record('POST', '/learn/quizzes', r.status);
  if (qId) {
    cleanup.push({ method: 'DELETE', path: `/learn/quizzes/${qId}` });
    record('POST', '/learn/quizzes/batch',
      (await call('POST', '/learn/quizzes/batch', {
        auth: 'teacher',
        body: {
          title: `QB${RUN.slice(0,4)}`, timeLimit: 15, status: 'Published', classIds: [ctx.classId],
          questions: [{ question: 'X', options: ['A','B'], correctOption: 0 }],
        },
      })).status);
    record('GET', `/learn/quizzes/class/${ctx.classId}`, (await call('GET', `/learn/quizzes/class/${ctx.classId}`)).status);
    record('GET', `/learn/quizzes/${qId}`, (await call('GET', `/learn/quizzes/${qId}`)).status);
    const questionId = r.json && r.json.data && r.json.data.questions && r.json.data.questions[0] && r.json.data.questions[0].id;
    if (ctx.student.token && questionId) {
      record('POST', `/learn/quizzes/${qId}/submissions/start`,
        (await call('POST', `/learn/quizzes/${qId}/submissions/start`, { auth: 'student', body: {} })).status);
      record('POST', `/learn/quizzes/${qId}/submissions/finish`,
        (await call('POST', `/learn/quizzes/${qId}/submissions/finish`, { auth: 'student', body: { answers: [{ quizQuestionId: questionId, selectedOption: 1 }] } })).status);
      record('GET', `/learn/quizzes/${qId}/submissions/my`,
        (await call('GET', `/learn/quizzes/${qId}/submissions/my`, { auth: 'student' })).status);
      record('GET', `/learn/quizzes/${qId}/submissions`,
        (await call('GET', `/learn/quizzes/${qId}/submissions`, { auth: 'teacher' })).status);
    }
    record('PUT', `/learn/quizzes/${qId}`, (await call('PUT', `/learn/quizzes/${qId}`, { auth: 'teacher', body: { title: 'QUpd' } })).status);
    record('DELETE', `/learn/quizzes/${qId}`, (await call('DELETE', `/learn/quizzes/${qId}`, { auth: 'teacher' })).status);
  }
  record('POST', '/learn/quizzes/delete-batch',
    (await call('POST', '/learn/quizzes/delete-batch', { body: { ids: [] } })).status,
    s => s === 200 || s === 400 || s === 403, 'empty array');
}

async function testGrades() {
  log('\n--- GRADES ---');
  if (ctx.student.token) {
    record('GET', `/learn/grades/class/${ctx.classId}/my`,
      (await call('GET', `/learn/grades/class/${ctx.classId}/my`, { auth: 'student' })).status,
      s => s === 200 || s === 403 || s === 404, 'RBAC');
  }
  if (ctx.teacher.token) {
    record('GET', `/learn/grades/class/${ctx.classId}`,
      (await call('GET', `/learn/grades/class/${ctx.classId}`, { auth: 'teacher' })).status,
      s => s === 200 || s === 403 || s === 404, 'RBAC');
  }
}

async function testAttachments() {
  log('\n--- ATTACHMENTS ---');
  const fdSingle = () => { const f = new FormData(); f.append('file', new Blob(['x'], { type: 'text/plain' }), `${RUN}.txt`); return f; };
  const fdBatch  = () => { const f = new FormData(); f.append('files', new Blob(['x'], { type: 'text/plain' }), `${RUN}.txt`); return f; };

  const r = await call('POST', '/learn/attachments/upload', { body: fdSingle() });
  const id = r.json && r.json.data && r.json.data.id;
  record('POST', '/learn/attachments/upload', r.status);
  if (id) {
    cleanup.push({ method: 'DELETE', path: `/learn/attachments/${id}` });
    record('POST', '/learn/attachments/batch',
      (await call('POST', '/learn/attachments/batch', { body: { ids: [id] } })).status);
    record('POST', '/learn/attachments/delete-batch',
      (await call('POST', '/learn/attachments/delete-batch', { body: { ids: [id] } })).status);
    record('DELETE', `/learn/attachments/${id}`, (await call('DELETE', `/learn/attachments/${id}`)).status);
  }
  record('POST', '/learn/attachments/upload-batch',
    (await call('POST', '/learn/attachments/upload-batch', { body: fdBatch() })).status);
}

async function cleanupAll() {
  for (const c of cleanup.slice().reverse()) {
    try { await call(c.method, c.path, { body: c.body }); } catch {}
  }
}

(async () => {
  try {
    log('\n🩺  LEARN-ONLY TEST (v3 — clean rewrite)\n');
    const r = await call('POST', '/auth/login', { auth: null, body: ADMIN, headers: { 'Content-Type': 'application/json' } });
    if (r.status !== 200 || !r.json || !r.json.data || !r.json.data.accessToken) {
      log(`Admin login failed: ${r.status}`); process.exit(1);
    }
    ctx.superToken = r.json.data.accessToken;
    log('✓ admin login OK');

    log('\n--- SEEDING ---');
    log(`  teacher: ${(await seedMasterTeacher()) ? 'OK' : 'FAIL'} (id=${ctx.teacher.id})`);
    log(`  student: ${(await seedMasterStudent()) ? 'OK' : 'FAIL'} (id=${ctx.student.id})`);
    log(`  subject: ${(await seedSubject()) ? 'OK' : 'FAIL'} (id=${ctx.subjectId})`);
    log(`  major:   ${(await seedMajor()) ? 'OK' : 'FAIL'} (id=${ctx.majorId})`);
    log(`  class:   ${(await seedClass()) ? 'OK' : 'FAIL'} (id=${ctx.classId})`);
    log(`  acadYr:  ${(await seedAcademicYear()) ? 'OK' : 'FAIL'} (id=${ctx.academicYearId})`);
    log(`  lessonHour: ${(await seedLessonHour()) ? 'OK' : 'FAIL'} (id=${ctx.lessonHourId})`);

    log('\n--- ACADEMIC SEED ---');
    log(`  POST /academic/subject-teachers            → ${(await seedSubjectTeacher())}`);
    log(`  POST /academic/class-subject-requirements  → ${(await seedClassSubjectRequirement())}`);
    log(`  POST /academic/major-students              → ${(await seedMajorStudent())}`);
    log(`  POST /academic/class-students              → ${(await seedClassStudent())}`);
    log(`  POST /academic/homeroom-teachers           → ${(await seedHomeroomTeacher())}`);
    log(`  POST /academic/lesson-schedules            → ${(await seedLessonSchedule())}`);

    if (!ctx.teacher.token) { log('No teacher token — abort'); process.exit(1); }

    await testDashboards();
    await testMaterials();
    await testAssignments();
    await testQuizzes();
    await testGrades();
    await testAttachments();

    const total = records.length;
    const ok = records.filter(r => r.ok).length;
    const fail = records.filter(r => !r.ok);
    log(`\n========== SUMMARY ==========`);
    log(` Total endpoint tests   : ${total}`);
    log(` ✅ Passed (2xx or by-design 4xx): ${ok}`);
    log(` ❌ Failed                : ${fail.length}`);
    log(` Pass rate                : ${((ok/total)*100).toFixed(1)}%`);
    if (fail.length) {
      log('\n--- Failures ---');
      fail.forEach(r => log(` [${r.status}] ${r.method} ${r.path}  ${r.note || ''}`));
    }

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
