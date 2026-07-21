/**
 * EduSpace auth.js — Authentication, Guards, UI Injection, Navigation
 * Loaded on every page EXCEPT index.html
 */

// ── User database (same as index.html) ─────────────────────────────────────
// Users keyed by EMAIL (matches index.html login)
const ES_USERS = {
  'rafi.ananda@student.sch.id':      { role:'siswa', nama:'Rafi Ananda',          avatar:'RA', kelas:'8A', absen:22, nis:'20240322', xp:2840, level:12, email:'rafi.ananda@student.sch.id', spesial:'' },
  'nadia.fitri@student.sch.id':      { role:'siswa', nama:'Nadia Fitri',           avatar:'NF', kelas:'7A', absen:18, nis:'20240118', xp:3210, level:14, email:'nadia.fitri@student.sch.id', spesial:'' },
  'dimas.kurnia@student.sch.id':     { role:'siswa', nama:'Dimas Kurnia',          avatar:'DK', kelas:'8A', absen:5,  nis:'20240305', xp:3050, level:13, email:'dimas.kurnia@student.sch.id', spesial:'' },
  'siti.rahayu@smpn3smg.sch.id':     { role:'guru',  nama:'Siti Rahayu, S.Pd',     avatar:'SR', mapel:'Matematika',    kelas:'7–9', nip:'199003152015042001', email:'siti.rahayu@smpn3smg.sch.id',    spesial:'Matematika (Aljabar)' },
  'budi.prasetyo@smpn3smg.sch.id':   { role:'guru',  nama:'Budi Prasetyo, S.Pd',   avatar:'BP', mapel:'IPA Terpadu',   kelas:'7–9', nip:'198506202010011002', email:'budi.prasetyo@smpn3smg.sch.id',  spesial:'IPA Terpadu' },
  'dewi.nurhayati@smpn3smg.sch.id':  { role:'guru',  nama:'Dewi Nurhayati, S.Pd',  avatar:'DN', mapel:'Bahasa Inggris',kelas:'7–9', nip:'199112082016042003', email:'dewi.nurhayati@smpn3smg.sch.id', spesial:'B. Inggris' },
  'admin@smpn3smg.sch.id':           { role:'admin', nama:'Administrator', avatar:'AD', jabatan:'Admin Sistem', email:'admin@smpn3smg.sch.id' },
  'wulandari@smpn3smg.sch.id':       { role:'waka',  nama:'Dra. Wulandari, M.Pd',  avatar:'WK', jabatan:'Waka Kurikulum', nip:'197208152001122001', email:'wulandari@smpn3smg.sch.id', spesial:'Manajemen Pendidikan' },
};

const ES_ROLE_HOME = {
  siswa: 'homepage_eduspace.html',
  guru:  'homepage_guru_eduspace.html',
  waka:  'homepage_waka_kurikulum_eduspace.html',
  admin: 'admin_dashboard.html',
};

// Pages each role is allowed to visit (filename without .html)
const ES_ALLOWED = {
  siswa: ['homepage_eduspace','kelas_saya','materi_pelajaran','tugas_kuis','nilai_saya','forum_diskusi','teman_sekelas','profil_saya','logic_flow_murid'],
  guru:  ['homepage_guru_eduspace','guru_kelas_saya','guru_upload_materi','guru_tugas_kuis','guru_input_nilai','guru_forum_diskusi','guru_jadwal_mengajar','guru_profil_saya','logic_flow_guru'],
  admin: ['admin_dashboard','admin_guru','admin_siswa','admin_ta','admin_semester','admin_jurusan','admin_kelas','admin_mapel','admin_wali_kelas','admin_guru_mapel','admin_siswa_jurusan','admin_siswa_kelas','admin_jadwal'],
  waka:  ['homepage_waka_kurikulum_eduspace','waka_performa_guru','waka_performa_murid','waka_kelengkapan_rpp','waka_upload_materi','waka_jadwal_silabus','waka_capaian_kikd','waka_kehadiran','waka_kirim_pengumuman','waka_ekspor_laporan','waka_profil_saya','logic_flow_waka'],
};

// ── Auth API ────────────────────────────────────────────────────────────────
const Auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem('es_user') || 'null'); }
    catch { return null; }
  },
  logout() {
    localStorage.removeItem('es_user');
    window.location.href = 'index.html';
  },
};

// ── Get current page name ───────────────────────────────────────────────────
function esCurrentPage() {
  const path = location.pathname;
  const file = path.split('/').pop().split('\\').pop(); // handle both / and \ separators
  return file.replace('.html','') || 'index';
}

// ── Guard: run on every page load ──────────────────────────────────────────
function esGuard() {
  const page = esCurrentPage();

  // Never guard index page
  if (page === 'index' || page === '') return null;

  const user = Auth.getUser();

  // Not logged in → go to login
  if (!user) {
    window.location.replace('index.html');
    return null;
  }

  // Check if this page belongs to user's role
  const allowed = ES_ALLOWED[user.role] || [];
  if (!allowed.includes(page)) {
    // Redirect to correct home
    window.location.replace(ES_ROLE_HOME[user.role] || 'index.html');
    return null;
  }

  return user;
}

// ── UI: inject user data into DOM ───────────────────────────────────────────
function esInjectUser(user) {
  if (!user) return;

  // -- Avatar elements --
  document.querySelectorAll('.av').forEach(el => {
    el.textContent = user.avatar;
    const colors = { siswa:['#EEEDFE','#3C3489'], guru:['#E1F5EE','#085041'], waka:['#E6F1FB','#0C447C'] }[user.role] || ['#F1EFE8','#444441'];
    el.style.background = colors[0];
    el.style.color = colors[1];
    el.style.cursor = 'pointer';
  });

  // -- Sidebar profile --
  document.querySelectorAll('.prof-av').forEach(el => {
    el.textContent = user.avatar;
    const colors = { siswa:['#EEEDFE','#534AB7'], guru:['#E1F5EE','#0F6E56'], waka:['#E6F1FB','#185FA5'] }[user.role] || ['#F1EFE8','#444441'];
    el.style.background = colors[0];
    el.style.color = colors[1];
  });

  document.querySelectorAll('.prof-name').forEach(el => el.textContent = user.nama);

  document.querySelectorAll('.prof-sub').forEach(el => {
    if (user.role === 'siswa') el.textContent = `Kelas ${user.kelas} · No. Absen ${user.absen}`;
    else if (user.role === 'guru') el.textContent = `${user.mapel} · Kelas ${user.kelas}`;
    else el.textContent = 'SMP Negeri 3 Semarang';
  });

  // -- XP bar (siswa only) --
  if (user.role === 'siswa') {
    const nextLevel = user.level * 200;
    const currentXP = user.xp;
    const prevLevelXP = (user.level - 1) * 200;
    const pct = Math.round((currentXP - prevLevelXP) / 200 * 100);

    document.querySelectorAll('.xp-row').forEach(el => {
      const spans = el.querySelectorAll('span');
      if (spans[0]) spans[0].textContent = `Level ${user.level} · ${currentXP.toLocaleString('id')} XP`;
      if (spans[1]) spans[1].textContent = `→ ${nextLevel.toLocaleString('id')}`;
    });
    document.querySelectorAll('.xp-fill').forEach(el => el.style.width = Math.max(5, pct) + '%');
  }

  // -- Greeting --
  document.querySelectorAll('.greet-text, .page-title.greet').forEach(el => {
    const h = new Date().getHours();
    const s = h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam';
    if (el.textContent.includes('Selamat') || el.classList.contains('greet')) {
      el.textContent = `Selamat ${s}, ${user.nama.split(',')[0].split(' ')[0]}!`;
    }
  });

  // -- Profile page: big avatar --
  const bigAv = document.querySelector('.big-av, .prof-big-av');
  if (bigAv) {
    bigAv.textContent = user.avatar;
    const colors = { siswa:['#534AB7','#EEEDFE'], guru:['#1D9E75','#E1F5EE'], waka:['#378ADD','#E6F1FB'] }[user.role] || ['#888780','#F1EFE8'];
    bigAv.style.background = colors[0];
    bigAv.style.color = colors[1];
  }

  document.querySelectorAll('.prof-big-name').forEach(el => el.textContent = user.nama);
  document.querySelectorAll('.prof-big-sub').forEach((el, i) => {
    if (i === 0) {
      if (user.role === 'siswa') el.textContent = `Kelas ${user.kelas} · SMP Negeri 3 Semarang`;
      else if (user.role === 'guru') el.textContent = `Guru ${user.mapel} · SMP Negeri 3 Semarang`;
      else el.textContent = 'SMP Negeri 3 Semarang';
    }
    if (i === 1) {
      if (user.role === 'siswa') el.textContent = `No. Absen ${user.absen} · NIS ${user.nis}`;
      else if (user.role === 'guru') el.textContent = `NIP: ${user.nip}`;
      else el.textContent = `NIP: ${user.nip}`;
    }
  });

  // -- Info rows (profile pages) --
  document.querySelectorAll('.info-row').forEach(row => {
    const lbl = row.querySelector('.info-lbl');
    const val = row.querySelector('.info-val, [id^="v-"]');
    if (!lbl || !val) return;
    const map = {
      'Nama lengkap': user.nama,
      'NIP': user.nip || '-',
      'NIS': user.nis || '-',
      'Email': user.email || '-',
      'Spesialisasi': user.spesial || '-',
      'Jabatan': user.jabatan || 'Waka Kurikulum',
    };
    const key = lbl.textContent.trim();
    if (map[key]) val.textContent = map[key];
  });

  // -- Page-specific sub info --
  const pgSub = document.querySelector('.page-sub');
  if (pgSub && user.role === 'siswa' && pgSub.textContent.includes('Kelas')) {
    // leave as is (already set per page)
  }
}

// ── Navigation helpers ──────────────────────────────────────────────────────
function esInitNav(user) {
  // Hamburger sidebar
  const btn = document.getElementById('menuBtn');
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('overlay');
  if (btn && sb && ov) {
    btn.addEventListener('click', () => {
      const open = sb.classList.contains('open');
      sb.classList.toggle('open', !open);
      ov.classList.toggle('show', !open);
    });
    ov.addEventListener('click', () => { sb.classList.remove('open'); ov.classList.remove('show'); });
  }

  // Auto-highlight current page in sidebar
  const currentFile = location.pathname.split('/').pop().split('\\').pop();
  document.querySelectorAll('.ni[href]').forEach(n => {
    if (n.getAttribute('href') === currentFile) n.classList.add('active');
  });

  // Close sidebar on nav click (mobile)
  document.querySelectorAll('.ni').forEach(n => {
    n.addEventListener('click', () => {
      if (window.innerWidth <= 640 && sb) {
        sb.classList.remove('open');
        if (ov) ov.classList.remove('show');
      }
    });
  });

  // FAB
  esAddFAB(user);
}

// ── FAB (Floating Action Button) ───────────────────────────────────────────
function esAddFAB(user) {
  const fab = document.createElement('div');
  fab.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9000;display:flex;flex-direction:column;align-items:flex-end;gap:6px';

  const menu = document.createElement('div');
  menu.style.cssText = 'display:none;flex-direction:column;gap:4px;align-items:flex-end';

  const roleColors = { siswa:'#534AB7', guru:'#1D9E75', waka:'#378ADD' };
  const accentColor = roleColors[user ? user.role : 'siswa'] || '#534AB7';

  const profilePages = { siswa:'profil_saya.html', guru:'guru_profil_saya.html', waka:'waka_profil_saya.html' };

  const items = [
    { icon:'←', label:'Ganti Role / Keluar', fn: () => Auth.logout() },
    { icon:'👤', label: user ? user.nama.split(',')[0].split(' ').slice(0,2).join(' ') : 'Profil', fn: () => { if (user) window.location.href = profilePages[user.role]; } },
  ];

  items.forEach(item => {
    const b = document.createElement('button');
    b.style.cssText = `display:flex;align-items:center;gap:8px;padding:7px 14px;border-radius:20px;border:0.5px solid rgba(0,0,0,0.12);background:var(--surface,#fff);color:var(--text-1,#1A1918);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;transition:background .15s`;
    b.innerHTML = `<span style="font-size:13px">${item.icon}</span>${item.label}`;
    b.addEventListener('click', item.fn);
    b.addEventListener('mouseenter', () => b.style.background = 'var(--surface-2,#F4F3EF)');
    b.addEventListener('mouseleave', () => b.style.background = 'var(--surface,#fff)');
    menu.appendChild(b);
  });

  const mainBtn = document.createElement('button');
  mainBtn.style.cssText = `width:44px;height:44px;border-radius:50%;background:${accentColor};color:white;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500;font-size:12px;transition:transform .2s,opacity .15s;display:flex;align-items:center;justify-content:center;flex-shrink:0`;
  mainBtn.textContent = user ? user.avatar : '?';
  mainBtn.title = 'Menu akun';

  let isOpen = false;
  mainBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    menu.style.display = isOpen ? 'flex' : 'none';
    mainBtn.style.opacity = isOpen ? '0.8' : '1';
  });
  document.addEventListener('click', () => {
    if (isOpen) { isOpen = false; menu.style.display = 'none'; mainBtn.style.opacity = '1'; }
  });

  fab.appendChild(menu);
  fab.appendChild(mainBtn);
  document.body.appendChild(fab);
}

// ── Toast notification ──────────────────────────────────────────────────────
window.showToast = function(msg, type) {
  document.querySelector('.es-toast')?.remove();
  const c = { success:['#E1F5EE','#1D9E75','#085041'], error:['#FCEBEB','#E24B4A','#791F1F'], info:['#E6F1FB','#378ADD','#0C447C'], warning:['#FAEEDA','#BA7517','#633806'] }[type || 'success'];
  const d = document.createElement('div');
  d.className = 'es-toast';
  d.style.cssText = `position:fixed;bottom:80px;right:20px;z-index:9999;padding:10px 16px;border-radius:10px;font-size:12px;font-family:'DM Sans',sans-serif;background:${c[0]};border:0.5px solid ${c[1]};color:${c[2]};font-weight:500;max-width:300px;line-height:1.5`;
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => { d.style.transition='opacity .3s'; d.style.opacity='0'; setTimeout(()=>d.remove(),300); }, 3000);
};

// ── Tab switcher utility ────────────────────────────────────────────────────
window.switchTab = function(activeId, allIds, allPanelIds) {
  allIds.forEach(id => { const el = document.getElementById(id); if (el) el.classList.toggle('on', id === activeId); });
  const panelId = activeId.replace(/^tab/, 'panel').replace(/^t(\d)/, 'p$1');
  allPanelIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = id === panelId ? '' : 'none'; });
};

// ── Main init ───────────────────────────────────────────────────────────────
(function init() {
  const user = esGuard();
  if (!user) return; // redirecting

  esInjectUser(user);
  esInitNav(user);

  // Expose Auth globally for inline onclick handlers
  window.Auth = Auth;
})();
