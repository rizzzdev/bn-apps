// test_academic_endpoints.cjs
// Comprehensive endpoint test suite for Academic Service using super@admin.com / superadmin123
const fs = require('fs');

const BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const API_KEY = process.env.API_KEY || 'bn-secret-api-key';
const USER = { identifier: 'super@admin.com', password: 'superadmin123' };

const results = [];
let token = '';

function log(...args) {
  console.log(...args);
}

async function call(method, path, body = null, useAuth = true) {
  const url = `${BASE}${path}`;
  const headers = {};
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (useAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let status = 0;
  let text = '';
  let json = null;
  try {
    const res = await fetch(url, opts);
    status = res.status;
    text = await res.text();
    try { json = JSON.parse(text); } catch { json = null; }
  } catch (e) {
    text = e.message;
  }

  return { status, text, json };
}

function recordTest(module, method, path, status, ok, note = '') {
  const tag = ok ? '✅ PASS' : '❌ FAIL';
  const entry = `[${tag}] ${module.padEnd(25)} ${method.padEnd(6)} ${path.padEnd(50)} -> ${status} ${note ? `(${note})` : ''}`;
  log(entry);
  results.push(entry);
}

async function runTests() {
  log('================================================================');
  log('  ACADEMIC SERVICE ENDPOINT TEST SUITE');
  log('  User:', USER.identifier);
  log('================================================================\n');

  // Step 1: Ensure User exists & Login
  log('--- Step 1: Authentication ---');
  let loginRes = await call('POST', '/auth/login', USER, false);

  if (loginRes.status !== 200 || !loginRes.json?.data?.accessToken) {
    log('Login failed, attempting auto-register super@admin.com user...');
    const regRes = await call('POST', '/auth/register', {
      identifiers: [{ type: 'email', value: USER.identifier }],
      password: USER.password,
      roles: ['super_admin'],
    }, false);
    log('Register status:', regRes.status);
    loginRes = await call('POST', '/auth/login', USER, false);
  }

  if (loginRes.status === 200 && loginRes.json?.data?.accessToken) {
    token = loginRes.json.data.accessToken;
    recordTest('AUTH', 'POST', '/auth/login', loginRes.status, true, 'Logged in successfully');
  } else {
    recordTest('AUTH', 'POST', '/auth/login', loginRes.status, false, 'Failed to obtain access token');
    log('Aborting tests due to auth failure.');
    process.exit(1);
  }

  // Step 2: Test Shadow DB Endpoints
  log('\n--- Step 2: Shadow Database Endpoints ---');

  // 2.1 Trigger Manual Shadow Sync
  const syncRes = await call('POST', '/academic/shadow-sync');
  recordTest('SHADOW-SYNC', 'POST', '/academic/shadow-sync', syncRes.status, syncRes.status === 200);

  // 2.2 Shadow Academic Years
  const ayList = await call('GET', '/academic/shadow-academic-years');
  recordTest('SHADOW-AY', 'GET', '/academic/shadow-academic-years', ayList.status, ayList.status === 200);
  const ayId = ayList.json?.data?.[0]?.id || 'dummy-ay-id';
  const ayDetail = await call('GET', `/academic/shadow-academic-years/${ayId}`);
  recordTest('SHADOW-AY', 'GET', `/academic/shadow-academic-years/${ayId}`, ayDetail.status, ayDetail.status === 200 || ayDetail.status === 404);

  // 2.3 Shadow Classes
  const classList = await call('GET', '/academic/shadow-classes');
  recordTest('SHADOW-CLASS', 'GET', '/academic/shadow-classes', classList.status, classList.status === 200);
  const classId = classList.json?.data?.[0]?.id || 'dummy-class-id';
  const classDetail = await call('GET', `/academic/shadow-classes/${classId}`);
  recordTest('SHADOW-CLASS', 'GET', `/academic/shadow-classes/${classId}`, classDetail.status, classDetail.status === 200 || classDetail.status === 404);

  // 2.4 Shadow Majors
  const majorList = await call('GET', '/academic/shadow-majors');
  recordTest('SHADOW-MAJOR', 'GET', '/academic/shadow-majors', majorList.status, majorList.status === 200);
  const majorId = majorList.json?.data?.[0]?.id || 'dummy-major-id';
  const majorDetail = await call('GET', `/academic/shadow-majors/${majorId}`);
  recordTest('SHADOW-MAJOR', 'GET', `/academic/shadow-majors/${majorId}`, majorDetail.status, majorDetail.status === 200 || majorDetail.status === 404);

  // 2.5 Shadow Students
  const studentList = await call('GET', '/academic/shadow-students');
  recordTest('SHADOW-STUDENT', 'GET', '/academic/shadow-students', studentList.status, studentList.status === 200);
  const studentId = studentList.json?.data?.[0]?.id || 'dummy-student-id';
  const studentDetail = await call('GET', `/academic/shadow-students/${studentId}`);
  recordTest('SHADOW-STUDENT', 'GET', `/academic/shadow-students/${studentId}`, studentDetail.status, studentDetail.status === 200 || studentDetail.status === 404);

  // 2.6 Shadow Teachers
  const teacherList = await call('GET', '/academic/shadow-teachers');
  recordTest('SHADOW-TEACHER', 'GET', '/academic/shadow-teachers', teacherList.status, teacherList.status === 200);
  const teacherId = teacherList.json?.data?.[0]?.id || 'dummy-teacher-id';
  const teacherDetail = await call('GET', `/academic/shadow-teachers/${teacherId}`);
  recordTest('SHADOW-TEACHER', 'GET', `/academic/shadow-teachers/${teacherId}`, teacherDetail.status, teacherDetail.status === 200 || teacherDetail.status === 404);

  // 2.7 Shadow Subjects
  const subjectList = await call('GET', '/academic/shadow-subjects');
  recordTest('SHADOW-SUBJECT', 'GET', '/academic/shadow-subjects', subjectList.status, subjectList.status === 200);
  const subjectId = subjectList.json?.data?.[0]?.id || 'dummy-subject-id';
  const subjectDetail = await call('GET', `/academic/shadow-subjects/${subjectId}`);
  recordTest('SHADOW-SUBJECT', 'GET', `/academic/shadow-subjects/${subjectId}`, subjectDetail.status, subjectDetail.status === 200 || subjectDetail.status === 404);

  // Step 3: Test Academic Business Modules
  log('\n--- Step 3: Academic Business Modules ---');

  const modulesToTest = [
    { name: 'MAJOR-STUDENTS', path: '/academic/major-students' },
    { name: 'CLASS-STUDENTS', path: '/academic/class-students' },
    { name: 'HOMEROOM-TEACHERS', path: '/academic/homeroom-teachers' },
    { name: 'SUBJECT-TEACHERS', path: '/academic/subject-teachers' },
    { name: 'TEACHER-PICKET', path: '/academic/teacher-picket-schedules' },
    { name: 'MAJOR-HEADS', path: '/academic/major-heads' },
    { name: 'LESSON-HOURS', path: '/academic/lesson-hours' },
    { name: 'CLASS-SUBJECT-REQ', path: '/academic/class-subject-requirements' },
    { name: 'TEACHER-UNAVAILABILITY', path: '/academic/teacher-unavailabilities' },
    { name: 'LESSON-SCHEDULES', path: '/academic/lesson-schedules' },
  ];

  for (const mod of modulesToTest) {
    const resList = await call('GET', mod.path);
    recordTest(mod.name, 'GET', mod.path, resList.status, resList.status === 200 || resList.status === 404);

    const firstId = resList.json?.data?.[0]?.id;
    if (firstId) {
      const resDetail = await call('GET', `${mod.path}/${firstId}`);
      recordTest(mod.name, 'GET', `${mod.path}/${firstId}`, resDetail.status, resDetail.status === 200);
    }
  }

  // Generator & Special Operations
  const genPreview = await call('POST', '/academic/lesson-schedules/generator/preview', {});
  recordTest('GENERATOR', 'POST', '/academic/lesson-schedules/generator/preview', genPreview.status, genPreview.status < 500);

  // Step 4: Summary & Output Writing
  log('\n================================================================');
  log(`  TEST COMPLETED: ${results.length} ENDPOINTS TESTED`);
  log('================================================================');

  fs.writeFileSync('academic_results.txt', results.join('\n'), 'utf-8');
  log('\nResults written to academic_results.txt');
}

runTests();
