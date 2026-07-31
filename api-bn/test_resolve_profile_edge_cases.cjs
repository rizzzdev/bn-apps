// test_resolve_profile_edge_cases.cjs — edge-case tests for resolve-profile middleware.
// Verifies that profileId resolution behaves correctly for different user roles.
// Uses existing e2e fixtures where available to avoid duplicate-creation errors.

const BASE   = 'http://localhost:3000/api/v1';

const log = (...a) => console.log(...a);

async function call(method, path, auth, body, extraHeaders) {
  const h = { ...(extraHeaders || {}) };
  if (!(body instanceof FormData)) h['Content-Type'] = 'application/json';
  if (auth) h['Authorization'] = `Bearer ${auth}`;
  const opts = { method, headers: h };
  if (body) opts.body = body instanceof FormData ? body : JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, text };
  } catch (e) { return { status: 0, json: null, text: e.message }; }
}

async function login(identifier, password) {
  const r = await call('POST', '/auth/login', null, { identifier, password });
  if (r.status === 200 && r.json?.data?.accessToken) return r.json.data.accessToken;
  return null;
}

async function main() {
  log('\n🩺  RESOLVE-PROFILE EDGE CASE TEST\n');
  let passed = 0, total = 0;

  // Login as admin
  const adminTok = await login('testtest@test.com', 'testtest');
  if (!adminTok) { log('FAIL: admin login\n'); process.exit(1); }
  log('✓ admin login OK\n');

  // --- Case 1: Super_admin calling /learn/materials (profileId=undefined, but super_admin bypass) ---
  total++;
  {
    const r = await call('POST', '/learn/materials', adminTok,
      { title: 'EdgeCase', content: 'test', status: 'Draft', classIds: ['00000000-0000-0000-0000-000000000000'] }
    );
    const ok = r.status !== 403;
    const msg = r.json?.message || '';
    log(`  ${ok ? '✅' : '❌'} super_admin → ${r.status} "${msg.slice(0,50)}"`);
    if (ok) passed++;
  }

  // --- Case 2: Fresh-registered teacher with NO master record → no profileId → 403 ---
  total++;
  {
    const email = `e2e_noprofile_${Date.now().toString(36)}@test.com`;
    const reg = await call('POST', '/auth/register', null,
      { identifiers: [{ type: 'email', value: email }], password: 'P@ssw0rd12345', roles: ['teacher'] },
      { 'x-api-key': 'bn-secret-api-key' }
    );
    if (reg.status !== 201) { log(`FAIL: register ${email} → ${reg.status}`); process.exit(1); }
    const tok = await login(email, 'P@ssw0rd12345');
    if (!tok) { log('FAIL: fresh user login\n'); process.exit(1); }

    const r = await call('POST', '/learn/materials', tok,
      { title: 'EdgeCase', content: 'test', status: 'Draft', classIds: ['00000000-0000-0000-0000-000000000000'] }
    );
    const ok = r.status === 403;
    const msg = r.json?.message || '';
    const msgOk = msg.includes('Hanya Guru');
    log(`  ${ok && msgOk ? '✅' : '❌'} fresh-teacher (no profile) → ${r.status} "${msg.slice(0,50)}"`);
    if (ok && msgOk) passed++;
  }

  // --- Case 3: Fresh-registered student with NO master record → no profileId → 403 ---
  total++;
  {
    const email = `e2e_noprofile_student_${Date.now().toString(36)}@test.com`;
    const reg = await call('POST', '/auth/register', null,
      { identifiers: [{ type: 'email', value: email }], password: 'P@ssw0rd12345', roles: ['student'] },
      { 'x-api-key': 'bn-secret-api-key' }
    );
    if (reg.status !== 201) { log(`FAIL: register ${email} → ${reg.status}`); process.exit(1); }
    const tok = await login(email, 'P@ssw0rd12345');
    if (!tok) { log('FAIL: fresh student login\n'); process.exit(1); }

    // Student calling /learn/assignments/{id}/submissions needs profileId
    const r = await call('POST', '/learn/assignments/fake-id/submissions', tok,
      { content: 'test' }
    );
    const ok = r.status === 403;
    const msg = r.json?.message || '';
    const msgOk = msg.includes('Hanya Murid');
    log(`  ${ok && msgOk ? '✅' : '❌'} fresh-student (no profile) → ${r.status} "${msg.slice(0,50)}"`);
    if (ok && msgOk) passed++;
  }

  // --- Case 4: Linked teacher (master record exists) → profileId resolved → NOT 403 ---
  total++;
  {
    // Use admin to create a master teacher (auto-registers auth + links userId)
    const email = `e2e_profile_linked_${Date.now().toString(36)}@test.com`;
    const create = await call('POST', '/master/teachers', adminTok, {
      fullname: 'Profile Linked Teacher',
      email,
      password: 'P@ssw0rd12345',
      gender: 'L',
      nip: `NIP${Date.now().toString(36).toUpperCase().slice(0,10)}`,
      status: 'Aktif',
    });
    if (create.status !== 201 || !create.json?.data?.id) {
      log(`FAIL: create teacher → ${create.status}`); process.exit(1);
    }
    const tok = await login(email, 'P@ssw0rd12345');
    if (!tok) { log('FAIL: linked teacher login\n'); process.exit(1); }

    const r = await call('POST', '/learn/materials', tok,
      { title: 'EdgeCase', content: 'test', status: 'Draft', classIds: ['00000000-0000-0000-0000-000000000000'] }
    );
    const ok = r.status !== 403;
    const msg = r.json?.message || '';
    log(`  ${ok ? '✅' : '❌'} linked-teacher → ${r.status} "${msg.slice(0,50)}"`);
    if (ok) passed++;

    // Cleanup
    await call('DELETE', `/master/teachers/${create.json.data.id}`, adminTok);
  }

  // --- Case 5: No auth token at all → sentriAuth.protect() returns 401 BEFORE resolve-profile ---
  total++;
  {
    const r = await call('POST', '/learn/materials', null,
      { title: 'EdgeCase', content: 'test', status: 'Draft', classIds: ['00000000-0000-0000-0000-000000000000'] }
    );
    const ok = r.status === 401;
    const msg = r.json?.message || '';
    log(`  ${ok ? '✅' : '❌'} no-auth → ${r.status} "${msg.slice(0,50)}"`);
    if (ok) passed++;
  }

  // Summary
  log(`\n========== SUMMARY ==========`);
  log(` Total: ${total}, Passed: ${passed}, Failed: ${total - passed}`);
  log(` ${passed === total ? '✅ ALL PASSED' : '❌ SOME FAILED'}\n`);
  if (passed !== total) process.exit(1);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
