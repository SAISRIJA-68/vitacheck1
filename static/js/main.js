// main.js — shared across all pages

// ── Theme Toggle ──────────────────────────────────────────────
const themeBtn = document.getElementById('themeToggle');
const root = document.documentElement;

function applyTheme(t) {
  document.body.setAttribute('data-theme', t);
  localStorage.setItem('vitacheck_theme', t);
  if (themeBtn) themeBtn.textContent = t === 'dark' ? '☽' : '☀';
}

const savedTheme = localStorage.getItem('vitacheck_theme') || 'dark';
applyTheme(savedTheme);

if (themeBtn) themeBtn.addEventListener('click', () => {
  const cur = document.body.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});
