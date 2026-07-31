// scripts/seed_e2e_users.cjs
// Idempotent E2E seed script.
//   - Registers master users for: super_admin, teacher, student, industry_mentor
//   - Auto-rolls over academic year (POST /master/academic-years patches any active to Selesai)
//   - Creates core master records: subject, major, class, lesson-hour
//   - Establishes academic relationships: subject-teacher (with targetHours=24),
//     class-subject-requirement (weeklyHours=4, maxHoursPerDay=2),
//     homeroom-teacher, class-student
//   - Writes the resulting IDs to scripts/e2e_users.json for shared use across tests
//
// Usage:
//   node scripts/seed_e2e_users.cjs            (creates or re-uses existing data)
//   node scripts/seed_e2e_users.cjs --cleanup  (deletes all e2e entities it created)
//
const fs = require('fs');
const path = require('path');

const BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const API_KEY = process.env.API_KEY || 'bn-secret-api-key';
const OUTPUT_FILE = path.join(__dirname, 'e2e_users.json');
const isCleanup = process.argv.includes('--cleanup');

const ADMIN = { identifier: 'testtest@test.com', password: 'testtest' };

const E2E_TEACHER = {
  email: 'e2e_teacher@test.com',
  password: 'P@ssw0rd12345',
  fullname: 'E2E Seed Teacher',
  nip: '198001012005011099',
  gender: 'L',
  religion: 'Islam',
  phoneNumber: '081234567890',
  status: 'Aktif',
};
const E2E_STUDENT = {
  email: 'e2e_student@test.com',
  password: 'P@ssw0rd12345',
  fullname: 'E2E Seed Student',
  nis: '2099001',
  nisn: '002099001',
  gender: 'P',
  religion: 'Islam',
  phoneNumber: '081234567891',
  status: 'Aktif',
};
const E2E_MENTOR_PAYLOAD = () => ({
  email: 'e2e_mentor@test.com',
  username: 'e2e_mentor',
  password: 'P@ssw0rd12345',
  name: 'E2E Seed Mentor',
  prefixTitle: 'Ir.',
  suffixTitle: 'M.T.',
  position: 'Mentor',
  phone: '081234567892',
  status: 'Aktif',
});

const E2E_AY = { code: '2099/2100', startYear: 2099, endYear: 2100, status: 'Aktif' };
const E2E_SUBJECT = { code: 'E2E-SUBJ', name: 'E2E Seed Subject' };
const E2E_MAJOR   = { code: 'E2E-MAJ',  name: 'E2E Seed Major' };
const E2E_LESSON_HOUR = { name: 'Jam ke-E2E', startTime: '07:00', endTime: '08:00', order: 99 };

async function req(method, ep, body, token) {
  const headers = { 'x-api-key': API_KEY };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = ep.startsWith('http') ? ep : `${BASE}${ep}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try { res = await fetch(url, opts); }
  catch (e) { return { status: 0, json: null, text: e.message }; }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

async function loginAdmin() {
  const r = await req('POST', '/auth/login', ADMIN);
  if (r.status !== 200 || !r.json || !r.json.data || !r.json.data.accessToken) {
    throw new Error(`Admin login failed: ${r.status} ${r.text}`);
  }
  return r.json.data.accessToken;
}

async function ensureUser(ep, body, token) {
  // For master data: try POST first, on conflict check list and reuse
  const r = await req('POST', ep, body, token);
  if (r.status >= 200 && r.status < 300 && r.json && r.json.data && r.json.data.id) {
    return { id: r.json.data.id, created: true };
  }
  // Probably conflict — try GET and search by unique field
  const list = await req('GET', ep, null, token);
  if (list.json && Array.isArray(list.json.data)) {
    const hit = list.json.data.find(x => x.email === body.email || x.code === body.code || x.name === body.name || x.username === body.username);
    if (hit) return { id: hit.id, created: false };
  }
  throw new Error(`Failed to ensure ${ep} and unable to fetch from list: ${r.status} ${r.text}`);
}

async function ensureRelationship(ep, body, token) {
  // Best-effort: ignore conflicts
  const r = await req('POST', ep, body, token);
  return r.status;
}

(async function main() {
  if (isCleanup) {
    if (!fs.existsSync(OUTPUT_FILE)) {
      console.log('No e2e_users.json — nothing to clean.');
      return;
    }
    const token = await loginAdmin();
    const stored = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    console.log('Cleaning up e2e fixtures...');
    const del = async (ep, id) => { if (id) { try { await req('DELETE', `${ep}/${id}`, null, token); } catch {} } };

    // Delete academic relationships before master records (no strict FK but cleaner)
    await del('/academic/subject-teachers', stored.subjectTeacherId);
    await del('/academic/class-subject-requirements', stored.classSubjectRequirementId);
    await del('/academic/homeroom-teachers', stored.homeroomTeacherId);
    await del('/academic/class-students', stored.classStudentId);
    await del('/academic/lesson-hours', stored.lessonHourId);
    await del('/internship/industry-mentors', stored.mentorId);
    await del('/master/teachers', stored.teacherId);
    await del('/master/students', stored.studentId);
    await del('/master/classes', stored.classId);
    await del('/master/majors', stored.majorId);
    await del('/master/subjects', stored.subjectId);
    await del('/master/academic-years', stored.academicYearId);
    fs.unlinkSync(OUTPUT_FILE);
    console.log('OK cleanup.');
    return;
  }

  // (1) seed
  console.log('Seeding e2e fixtures...');
  const token = await loginAdmin();
  console.log('OK admin login.');

  const teacher = await ensureUser('/master/teachers', E2E_TEACHER, token);
  console.log(` teacher ${teacher.created ? 'created' : 'reused'}: ${teacher.id}`);
  const student = await ensureUser('/master/students', E2E_STUDENT, token);
  console.log(` student ${student.created ? 'created' : 'reused'}: ${student.id}`);
  const mentor  = await ensureUser('/internship/industry-mentors', E2E_MENTOR_PAYLOAD(), token);
  console.log(` mentor  ${mentor.created ? 'created' : 'reused'}: ${mentor.id}`);

  // Verify sub-logins
  const tr = await req('POST', '/auth/login', { identifier: E2E_TEACHER.email, password: E2E_TEACHER.password });
  const sr = await req('POST', '/auth/login', { identifier: E2E_STUDENT.email, password: E2E_STUDENT.password });
  if (tr.status !== 200 || sr.status !== 200) {
    console.warn(` sub-login preflight: teacher=${tr.status}, student=${sr.status}`);
  } else {
    console.log(' OK sub-logins (teacher+student).');
  }

  // Master data records
  const ay      = await ensureUser('/master/academic-years',  E2E_AY, token);
  console.log(` AY      ${ay.created ? 'created' : 'reused'}: ${ay.id}`);
  const subject = await ensureUser('/master/subjects', E2E_SUBJECT, token);
  console.log(` subject ${subject.created ? 'created' : 'reused'}: ${subject.id}`);
  const major   = await ensureUser('/master/majors',   E2E_MAJOR, token);
  console.log(` major   ${major.created ? 'created' : 'reused'}: ${major.id}`);

  // Class needs majorId assigned
  const classBody = { name: 'E2E-Class-' + Date.now(), majorId: major.id };
  const cls = await ensureUser('/master/classes', classBody, token);
  console.log(` class   ${cls.created ? 'created' : 'reused'}: ${cls.id}`);

  const lesson = await ensureUser('/academic/lesson-hours', E2E_LESSON_HOUR, token);
  console.log(` lessonHour ${lesson.created ? 'created' : 'reused'}: ${lesson.id}`);

  // Academic relationships (targetHours: 24 so weeklyHours validation passes)
  const stRes  = await ensureRelationship('/academic/subject-teachers',
    { teacherId: teacher.id, subjectId: subject.id, status: 'Aktif', targetHours: 24 }, token);
  console.log(` subject-teachers POST → ${stRes}`);

  const csrRes = await ensureRelationship('/academic/class-subject-requirements',
    { classId: cls.id, subjectId: subject.id, teacherId: teacher.id,
      weeklyHours: 4, maxHoursPerDay: 2 }, token);
  console.log(` class-subject-requirements POST → ${csrRes}`);

  const hmtRes = await ensureRelationship('/academic/homeroom-teachers',
    { teacherId: teacher.id, classId: cls.id, academicYearId: ay.id, status: 'Aktif' }, token);
  console.log(` homeroom-teachers POST → ${hmtRes}`);

  const clsRes = await ensureRelationship('/academic/class-students',
    { studentId: student.id, classId: cls.id, academicYearId: ay.id, status: 'Aktif' }, token);
  console.log(` class-students POST → ${clsRes}`);

  // Re-fetch IDs of all academic relationships for cleanup convenience
  const sts  = (await req('GET', `/academic/subject-teachers?teacherId=${teacher.id}`, null, token)).json;
  const csrs = (await req('GET', `/academic/class-subject-requirements?teacherId=${teacher.id}`, null, token)).json;
  const hmts = (await req('GET', `/academic/homeroom-teachers?teacherId=${teacher.id}`, null, token)).json;
  const clss = (await req('GET', `/academic/class-students?studentId=${student.id}`, null, token)).json;

  const subjectTeacherId         = sts?.data?.[0]?.id  || '';
  const classSubjectRequirementId = csrs?.data?.[0]?.id || '';
  const homeroomTeacherId        = hmts?.data?.[0]?.id || '';
  const classStudentId           = clss?.data?.[0]?.id || '';

  // (2) write output
  const out = {
    admin: { identifier: ADMIN.identifier, password: ADMIN.password },
    teacher: { id: teacher.id, email: E2E_TEACHER.email, password: E2E_TEACHER.password },
    student: { id: student.id, email: E2E_STUDENT.email, password: E2E_STUDENT.password },
    mentor:  { id: mentor.id,  email: E2E_MENTOR_PAYLOAD().email, username: E2E_MENTOR_PAYLOAD().username, password: E2E_MENTOR_PAYLOAD().password },
    academicYearId: ay.id,
    subjectId: subject.id,
    majorId: major.id,
    classId: cls.id,
    lessonHourId: lesson.id,
    subjectTeacherId, classSubjectRequirementId, homeroomTeacherId, classStudentId,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out, null, 2));
  console.log(`OK wrote ${OUTPUT_FILE}`);
})().catch(err => {
  console.error('Seed error:', err && err.message);
  process.exit(1);
});
