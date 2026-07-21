// EduSpace Shared Navigation & UX Logic

// ── Sidebar hamburger ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('menuBtn');
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('overlay');

  if (btn && sb && ov) {
    function openMenu()  { sb.classList.add('open');  ov.classList.add('show'); }
    function closeMenu() { sb.classList.remove('open'); ov.classList.remove('show'); }
    btn.addEventListener('click', () => sb.classList.contains('open') ? closeMenu() : openMenu());
    ov.addEventListener('click', closeMenu);
  }

  // ── Active nav item ────────────────────────────────────────────────────────
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.ni').forEach(n => {
    if (n.href) {
      const href = n.getAttribute('href');
      if (href && href.includes(currentFile)) {
        n.classList.add('active');
      }
    }
  });

  // ── Tab switcher helper ────────────────────────────────────────────────────
  window.switchTab = function(activeId, allTabIds, allPanelIds) {
    allTabIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('on', id === activeId);
    });
    const activePanelId = activeId.replace('tab', 'panel').replace('t', 'p');
    allPanelIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (id === activePanelId) ? '' : 'none';
    });
  };

  // ── Toast notification ─────────────────────────────────────────────────────
  window.showToast = function(message, type = 'success') {
    const existing = document.querySelector('.es-toast');
    if (existing) existing.remove();
    const colors = {
      success: { bg:'#E1F5EE', border:'#1D9E75', text:'#085041' },
      error:   { bg:'#FCEBEB', border:'#E24B4A', text:'#791F1F' },
      info:    { bg:'#E6F1FB', border:'#378ADD', text:'#0C447C' },
      warning: { bg:'#FAEEDA', border:'#BA7517', text:'#633806' }
    };
    const c = colors[type] || colors.success;
    const toast = document.createElement('div');
    toast.className = 'es-toast';
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 16px;border-radius:10px;font-size:12px;font-family:'DM Sans',sans-serif;background:${c.bg};border:0.5px solid ${c.border};color:${c.text};font-weight:500;max-width:300px;line-height:1.4;animation:fadeInUp .25s ease`;
    toast.textContent = message;
    const style = document.createElement('style');
    style.textContent = '@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity .3s'; setTimeout(()=>toast.remove(), 300); }, 3000);
  };

  // ── Confirm dialog helper ────────────────────────────────────────────────────
  window.esConfirm = function(message, onYes) {
    if (confirm(message)) onYes();
  };

  // ── Role switcher button (add to all pages) ───────────────────────────────
  const roleSwitcher = document.createElement('div');
  roleSwitcher.id = 'roleSwitcher';
  roleSwitcher.title = 'Ganti role / logout';
  roleSwitcher.style.cssText = `
    position:fixed;bottom:20px;right:20px;z-index:888;
    width:44px;height:44px;border-radius:50%;
    background:var(--surface);border:0.5px solid var(--border-med);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;transition:background .15s,transform .15s;
    box-shadow:0 2px 8px rgba(0,0,0,0.12);
  `;
  roleSwitcher.innerHTML = `<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 5l4 3-4 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  roleSwitcher.addEventListener('mouseenter', () => { roleSwitcher.style.transform='scale(1.08)'; roleSwitcher.style.background='var(--surface-2)'; });
  roleSwitcher.addEventListener('mouseleave', () => { roleSwitcher.style.transform=''; roleSwitcher.style.background='var(--surface)'; });
  roleSwitcher.addEventListener('click', () => { window.location.href = 'index.html'; });
  document.body.appendChild(roleSwitcher);

  // ── Tooltip for role switcher ─────────────────────────────────────────────
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `position:fixed;bottom:72px;right:20px;z-index:889;font-size:11px;padding:5px 10px;border-radius:6px;background:var(--surface);border:0.5px solid var(--border-med);color:var(--text-2);pointer-events:none;opacity:0;transition:opacity .2s;white-space:nowrap;font-family:'DM Sans',sans-serif;`;
  tooltip.textContent = 'Ganti role / Keluar';
  document.body.appendChild(tooltip);
  roleSwitcher.addEventListener('mouseenter', () => tooltip.style.opacity = '1');
  roleSwitcher.addEventListener('mouseleave', () => tooltip.style.opacity = '0');
});
