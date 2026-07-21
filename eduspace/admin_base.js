/**
 * EduSpace Admin — Shared data store, auth guard, and UI helpers
 * Loaded on every admin page
 */

// ─── MASTER DATA (in-memory, persisted to localStorage) ────────────────────
const DB = {
  _store: {},

  _load() {
    try {
      const raw = localStorage.getItem('es_admin_db');
      if (raw) this._store = JSON.parse(raw);
    } catch {}
    // Seed defaults if empty
    if (!this._store.seeded) this._seed();
  },

  _save() {
    try { localStorage.setItem('es_admin_db', JSON.stringify(this._store)); } catch {}
  },

  _seed() {
    this._store = {
      seeded: true,
      nextId: { guru:10, siswa:30, ta:3, semester:5, jurusan:4, kelas:8, mapel:12, waliKelas:5, guruMapel:8, siswaJurusan:15, siswaKelas:15, jadwal:15 },
      guru: [
        { id:1, nip:'199003152015042001', nama:'Siti Rahayu, S.Pd',     email:'siti.rahayu@smpn3smg.sch.id',    telepon:'081234567890', jk:'P', status:'aktif', spesial:'Matematika' },
        { id:2, nip:'198506202010011002', nama:'Budi Prasetyo, S.Pd',   email:'budi.prasetyo@smpn3smg.sch.id',  telepon:'081234567891', jk:'L', status:'aktif', spesial:'IPA Terpadu' },
        { id:3, nip:'199112082016042003', nama:'Dewi Nurhayati, S.Pd',  email:'dewi.nurhayati@smpn3smg.sch.id', telepon:'081234567892', jk:'P', status:'aktif', spesial:'Bahasa Inggris' },
        { id:4, nip:'197805102005011004', nama:'Agus Santoso, S.Pd',    email:'agus.santoso@smpn3smg.sch.id',   telepon:'081234567893', jk:'L', status:'aktif', spesial:'Bahasa Indonesia' },
        { id:5, nip:'198203252008012005', nama:'Rudi Hartono, S.Pd',    email:'rudi.hartono@smpn3smg.sch.id',   telepon:'081234567894', jk:'L', status:'aktif', spesial:'IPS Terpadu' },
        { id:6, nip:'198901142012042006', nama:'Yuni Setiawati, S.Pd',  email:'yuni.setiawati@smpn3smg.sch.id', telepon:'081234567895', jk:'P', status:'aktif', spesial:'PKn' },
        { id:7, nip:'199508272018012007', nama:'Rina Marlina, S.Pd',    email:'rina.marlina@smpn3smg.sch.id',   telepon:'081234567896', jk:'P', status:'aktif', spesial:'Seni Budaya' },
        { id:8, nip:'199212032020011008', nama:'Hendra Wijaya, S.Pd',   email:'hendra.wijaya@smpn3smg.sch.id',  telepon:'081234567897', jk:'L', status:'aktif', spesial:'PJOK' },
        { id:9, nip:'198706182014011009', nama:'Lilis Suryani, S.Pd',   email:'lilis.suryani@smpn3smg.sch.id',  telepon:'081234567898', jk:'P', status:'aktif', spesial:'TIK' },
      ],
      siswa: [
        { id:1,  nis:'20240101', nama:'Rafi Ananda',       email:'rafi.ananda@student.sch.id',    telepon:'082111111111', jk:'L', tglLahir:'2011-03-15', status:'aktif' },
        { id:2,  nis:'20240102', nama:'Nadia Fitri',        email:'nadia.fitri@student.sch.id',    telepon:'082111111112', jk:'P', tglLahir:'2011-05-22', status:'aktif' },
        { id:3,  nis:'20240103', nama:'Dimas Kurnia',       email:'dimas.kurnia@student.sch.id',   telepon:'082111111113', jk:'L', tglLahir:'2011-07-10', status:'aktif' },
        { id:4,  nis:'20240104', nama:'Sari Pratiwi',       email:'sari.pratiwi@student.sch.id',   telepon:'082111111114', jk:'P', tglLahir:'2011-09-05', status:'aktif' },
        { id:5,  nis:'20240105', nama:'Bagas Putra',        email:'bagas.putra@student.sch.id',    telepon:'082111111115', jk:'L', tglLahir:'2011-11-30', status:'aktif' },
        { id:6,  nis:'20240201', nama:'Fajar Ramadhan',     email:'fajar.ramadhan@student.sch.id', telepon:'082111111116', jk:'L', tglLahir:'2010-02-14', status:'aktif' },
        { id:7,  nis:'20240202', nama:'Lina Wati',          email:'lina.wati@student.sch.id',      telepon:'082111111117', jk:'P', tglLahir:'2010-04-19', status:'aktif' },
        { id:8,  nis:'20240203', nama:'Yoga Pratama',       email:'yoga.pratama@student.sch.id',   telepon:'082111111118', jk:'L', tglLahir:'2010-06-25', status:'aktif' },
        { id:9,  nis:'20240204', nama:'Maya Sari',          email:'maya.sari@student.sch.id',      telepon:'082111111119', jk:'P', tglLahir:'2010-08-12', status:'aktif' },
        { id:10, nis:'20240205', nama:'Rizky Maulana',      email:'rizky.maulana@student.sch.id',  telepon:'082111111120', jk:'L', tglLahir:'2010-10-03', status:'aktif' },
      ],
      ta: [
        { id:1, kode:'2023/2024', nama:'Tahun Ajaran 2023/2024', mulai:'2023-07-10', selesai:'2024-06-28', aktif:false },
        { id:2, kode:'2024/2025', nama:'Tahun Ajaran 2024/2025', mulai:'2024-07-08', selesai:'2025-06-27', aktif:false },
        { id:3, kode:'2025/2026', nama:'Tahun Ajaran 2025/2026', mulai:'2025-07-07', selesai:'2026-06-26', aktif:true  },
      ],
      semester: [
        { id:1, taId:2, nama:'Ganjil 2024/2025',  tipe:'ganjil', mulai:'2024-07-08', selesai:'2024-12-20', aktif:false },
        { id:2, taId:2, nama:'Genap 2024/2025',   tipe:'genap',  mulai:'2025-01-06', selesai:'2025-06-27', aktif:false },
        { id:3, taId:3, nama:'Ganjil 2025/2026',  tipe:'ganjil', mulai:'2025-07-07', selesai:'2025-12-19', aktif:false },
        { id:4, taId:3, nama:'Genap 2025/2026',   tipe:'genap',  mulai:'2026-01-05', selesai:'2026-06-26', aktif:true  },
      ],
      jurusan: [
        { id:1, kode:'IPA',  nama:'Ilmu Pengetahuan Alam',   deskripsi:'Fokus sains dan matematika' },
        { id:2, kode:'IPS',  nama:'Ilmu Pengetahuan Sosial', deskripsi:'Fokus sosial dan humaniora' },
        { id:3, kode:'UMUM', nama:'Umum / Reguler',          deskripsi:'Program reguler SMP' },
      ],
      kelas: [
        { id:1, nama:'7A', tingkat:7, jurusanId:3, kapasitas:32 },
        { id:2, nama:'7B', tingkat:7, jurusanId:3, kapasitas:32 },
        { id:3, nama:'7C', tingkat:7, jurusanId:3, kapasitas:32 },
        { id:4, nama:'8A', tingkat:8, jurusanId:3, kapasitas:33 },
        { id:5, nama:'8B', tingkat:8, jurusanId:3, kapasitas:33 },
        { id:6, nama:'9A', tingkat:9, jurusanId:1, kapasitas:34 },
        { id:7, nama:'9B', tingkat:9, jurusanId:2, kapasitas:34 },
      ],
      mapel: [
        { id:1,  kode:'MTK',  nama:'Matematika',        tingkat:'7,8,9', kkm:70, jplPerMinggu:4, wajib:true  },
        { id:2,  kode:'IPA',  nama:'IPA Terpadu',       tingkat:'7,8,9', kkm:70, jplPerMinggu:5, wajib:true  },
        { id:3,  kode:'IPS',  nama:'IPS Terpadu',       tingkat:'7,8,9', kkm:70, jplPerMinggu:4, wajib:true  },
        { id:4,  kode:'BIN',  nama:'Bahasa Indonesia',  tingkat:'7,8,9', kkm:75, jplPerMinggu:6, wajib:true  },
        { id:5,  kode:'BIG',  nama:'Bahasa Inggris',    tingkat:'7,8,9', kkm:70, jplPerMinggu:4, wajib:true  },
        { id:6,  kode:'PKN',  nama:'PKn',               tingkat:'7,8,9', kkm:75, jplPerMinggu:2, wajib:true  },
        { id:7,  kode:'AGM',  nama:'Pendidikan Agama',  tingkat:'7,8,9', kkm:75, jplPerMinggu:3, wajib:true  },
        { id:8,  kode:'SBD',  nama:'Seni Budaya',       tingkat:'7,8,9', kkm:70, jplPerMinggu:2, wajib:true  },
        { id:9,  kode:'PJK',  nama:'PJOK',              tingkat:'7,8,9', kkm:70, jplPerMinggu:3, wajib:true  },
        { id:10, kode:'TIK',  nama:'TIK / Informatika', tingkat:'7,8,9', kkm:70, jplPerMinggu:2, wajib:false },
        { id:11, kode:'BDA',  nama:'Bahasa Daerah',     tingkat:'7,8,9', kkm:70, jplPerMinggu:2, wajib:false },
      ],
      waliKelas: [
        { id:1, guruId:1, kelasId:4, taId:3, semesterId:4 },
        { id:2, guruId:2, kelasId:5, taId:3, semesterId:4 },
        { id:3, guruId:3, kelasId:1, taId:3, semesterId:4 },
        { id:4, guruId:4, kelasId:2, taId:3, semesterId:4 },
        { id:5, guruId:5, kelasId:6, taId:3, semesterId:4 },
      ],
      guruMapel: [
        { id:1, guruId:1, mapelId:1 },
        { id:2, guruId:2, mapelId:2 },
        { id:3, guruId:3, mapelId:5 },
        { id:4, guruId:4, mapelId:4 },
        { id:5, guruId:5, mapelId:3 },
        { id:6, guruId:6, mapelId:6 },
        { id:7, guruId:7, mapelId:8 },
        { id:8, guruId:8, mapelId:9 },
      ],
      siswaJurusan: [
        { id:1, siswaId:1, jurusanId:3, taId:3 },
        { id:2, siswaId:2, jurusanId:3, taId:3 },
        { id:3, siswaId:3, jurusanId:3, taId:3 },
        { id:4, siswaId:4, jurusanId:3, taId:3 },
        { id:5, siswaId:5, jurusanId:3, taId:3 },
        { id:6, siswaId:6, jurusanId:1, taId:3 },
        { id:7, siswaId:7, jurusanId:2, taId:3 },
      ],
      siswaKelas: [
        { id:1,  siswaId:1, kelasId:4, taId:3, absen:22 },
        { id:2,  siswaId:2, kelasId:1, taId:3, absen:18 },
        { id:3,  siswaId:3, kelasId:4, taId:3, absen:5  },
        { id:4,  siswaId:4, kelasId:1, taId:3, absen:26 },
        { id:5,  siswaId:5, kelasId:1, taId:3, absen:3  },
        { id:6,  siswaId:6, kelasId:6, taId:3, absen:12 },
        { id:7,  siswaId:7, kelasId:6, taId:3, absen:8  },
        { id:8,  siswaId:8, kelasId:5, taId:3, absen:17 },
        { id:9,  siswaId:9, kelasId:2, taId:3, absen:20 },
        { id:10, siswaId:10,kelasId:2, taId:3, absen:24 },
      ],
      jadwal: [
        { id:1,  mapelId:1, kelasId:4, guruId:1, hari:'Senin',   jamMulai:'07:00', jamSelesai:'08:20', ruangan:'R.01', semesterId:4 },
        { id:2,  mapelId:1, kelasId:1, guruId:1, hari:'Senin',   jamMulai:'08:30', jamSelesai:'09:50', ruangan:'R.01', semesterId:4 },
        { id:3,  mapelId:2, kelasId:4, guruId:2, hari:'Selasa',  jamMulai:'07:00', jamSelesai:'08:20', ruangan:'Lab',  semesterId:4 },
        { id:4,  mapelId:5, kelasId:1, guruId:3, hari:'Rabu',    jamMulai:'07:00', jamSelesai:'08:20', ruangan:'R.03', semesterId:4 },
        { id:5,  mapelId:3, kelasId:6, guruId:5, hari:'Kamis',   jamMulai:'07:00', jamSelesai:'08:20', ruangan:'R.04', semesterId:4 },
        { id:6,  mapelId:4, kelasId:2, guruId:4, hari:'Jumat',   jamMulai:'07:00', jamSelesai:'08:20', ruangan:'R.02', semesterId:4 },
        { id:7,  mapelId:1, kelasId:5, guruId:1, hari:'Kamis',   jamMulai:'09:00', jamSelesai:'10:20', ruangan:'R.01', semesterId:4 },
        { id:8,  mapelId:6, kelasId:3, guruId:6, hari:'Senin',   jamMulai:'09:00', jamSelesai:'09:45', ruangan:'R.05', semesterId:4 },
      ],
    };
    this._save();
  },

  get(table) { return this._store[table] || []; },

  nextId(table) {
    this._store.nextId = this._store.nextId || {};
    this._store.nextId[table] = (this._store.nextId[table] || 1) + 1;
    this._save();
    return this._store.nextId[table];
  },

  insert(table, record) {
    if (!this._store[table]) this._store[table] = [];
    const id = this.nextId(table);
    const row = { id, ...record };
    this._store[table].push(row);
    this._save();
    return row;
  },

  update(table, id, data) {
    const idx = this._store[table]?.findIndex(r => r.id === id);
    if (idx !== undefined && idx >= 0) {
      this._store[table][idx] = { ...this._store[table][idx], ...data };
      this._save();
      return this._store[table][idx];
    }
    return null;
  },

  delete(table, id) {
    if (!this._store[table]) return;
    this._store[table] = this._store[table].filter(r => r.id !== id);
    this._save();
  },

  findById(table, id) { return this._store[table]?.find(r => r.id === id) || null; },
};
DB._load();

// ─── LOOKUP HELPERS ─────────────────────────────────────────────────────────
const L = {
  guru(id)     { return DB.findById('guru', id)?.nama || '–'; },
  siswa(id)    { return DB.findById('siswa', id)?.nama || '–'; },
  kelas(id)    { return DB.findById('kelas', id)?.nama || '–'; },
  mapel(id)    { return DB.findById('mapel', id)?.nama || '–'; },
  jurusan(id)  { return DB.findById('jurusan', id)?.nama || '–'; },
  ta(id)       { return DB.findById('ta', id)?.kode || '–'; },
  semester(id) { return DB.findById('semester', id)?.nama || '–'; },
};

// ─── AUTH GUARD ──────────────────────────────────────────────────────────────
const ADMIN_PAGES = ['admin_dashboard','admin_guru','admin_siswa','admin_ta','admin_semester','admin_jurusan','admin_kelas','admin_mapel','admin_wali_kelas','admin_guru_mapel','admin_siswa_jurusan','admin_siswa_kelas','admin_jadwal'];

function adminGuard() {
  const file = location.pathname.split('/').pop().replace('.html','');
  if (!ADMIN_PAGES.includes(file)) return null; // not an admin page
  try {
    const user = JSON.parse(localStorage.getItem('es_user') || 'null');
    if (!user || user.role !== 'admin') {
      window.location.replace('index.html');
      return null;
    }
    return user;
  } catch {
    window.location.replace('index.html');
    return null;
  }
}

// ─── TOAST ──────────────────────────────────────────────────────────────────
function toast(msg, type) {
  document.querySelector('.adm-toast')?.remove();
  const colors = {
    success: ['#E1F5EE','#1D9E75','#085041'],
    error:   ['#FCEBEB','#E24B4A','#791F1F'],
    info:    ['#E6F1FB','#378ADD','#0C447C'],
    warning: ['#FAEEDA','#BA7517','#633806'],
  }[type||'success'];
  const d = document.createElement('div');
  d.className = 'adm-toast';
  d.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:11px 18px;border-radius:10px;font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif;background:${colors[0]};border:0.5px solid ${colors[1]};color:${colors[2]};display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);animation:adm-slide-up .2s ease`;
  d.innerHTML = `<span>${msg}</span>`;
  const style = document.createElement('style');
  style.textContent = '@keyframes adm-slide-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
  document.head.appendChild(style);
  document.body.appendChild(d);
  setTimeout(()=>{ d.style.opacity='0'; d.style.transition='opacity .3s'; setTimeout(()=>d.remove(),300); }, 3000);
}

// ─── MODAL SYSTEM ────────────────────────────────────────────────────────────
function openModal(html, onSave) {
  document.getElementById('admModal')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'admModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px;animation:adm-fadein .18s ease';
  overlay.innerHTML = `<div style="background:var(--surface);border-radius:14px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.25);">${html}</div>`;
  const style = document.createElement('style');
  style.textContent = '@keyframes adm-fadein{from{opacity:0}to{opacity:1}}';
  document.head.appendChild(style);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  // bind save button
  const btn = overlay.querySelector('[data-save]');
  if (btn && onSave) btn.addEventListener('click', () => { onSave(); });
  // bind cancel
  overlay.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', closeModal));
  // focus first input
  setTimeout(() => overlay.querySelector('input,select,textarea')?.focus(), 80);
}

function closeModal() {
  document.getElementById('admModal')?.remove();
  document.body.style.overflow = '';
}

// ─── CONFIRM DELETE ──────────────────────────────────────────────────────────
function confirmDelete(label, onYes) {
  openModal(`
    <div style="padding:28px 24px;text-align:center">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--red-50);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#E24B4A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div style="font-size:15px;font-weight:500;color:var(--text-1);margin-bottom:8px">Hapus data?</div>
      <div style="font-size:13px;color:var(--text-2);margin-bottom:24px;line-height:1.6">"<strong>${label}</strong>" akan dihapus permanen dan tidak bisa dikembalikan.</div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button data-cancel style="padding:8px 20px;border-radius:8px;border:0.5px solid var(--border-med);background:transparent;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--text-1)">Batal</button>
        <button id="confirmYes" style="padding:8px 20px;border-radius:8px;border:none;background:#E24B4A;color:white;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">Hapus</button>
      </div>
    </div>`, null);
  document.getElementById('confirmYes').addEventListener('click', () => { closeModal(); onYes(); });
}

// ─── HAMBURGER + ACTIVE NAV ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('menuBtn');
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('overlay');
  if (btn && sb && ov) {
    btn.addEventListener('click', () => {
      const open = sb.classList.toggle('open');
      ov.classList.toggle('show', open);
    });
    ov.addEventListener('click', () => { sb.classList.remove('open'); ov.classList.remove('show'); });
  }
  const cur = location.pathname.split('/').pop();
  document.querySelectorAll('.ni[href]').forEach(n => {
    if (n.getAttribute('href') === cur) n.classList.add('active');
  });
});
