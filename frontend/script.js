const API_BASE = 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://study-forge-backend-r9tj.onrender.com/api';

const state = {
  token: localStorage.getItem('studyForgeToken'),
  user: JSON.parse(localStorage.getItem('studyForgeUser') || 'null'),
  notes: [],
  timers: [],
  runningTimers: new Map(),
};

const $ = (id) => document.getElementById(id);

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function setAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('studyForgeToken', token);
  localStorage.setItem('studyForgeUser', JSON.stringify(user));
}

function clearAuth() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('studyForgeToken');
  localStorage.removeItem('studyForgeUser');
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = {};
  try { data = await response.json(); } catch {}

  if (response.status === 401 && !path.startsWith('/auth/')) {
    logout(false);
  }
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.authTab === tab));
  $('loginForm').classList.toggle('active', tab === 'login');
  $('registerForm').classList.toggle('active', tab === 'register');
}

document.querySelectorAll('.auth-tab').forEach((button) => button.addEventListener('click', () => switchAuthTab(button.dataset.authTab)));

$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('loginEmail').value, password: $('loginPassword').value }),
    });
    setAuth(data.token, data.user);
    $('loginForm').reset();
    showApp();
  } catch (error) {
    showToast(error.message);
  }
});

$('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: $('registerName').value,
        email: $('registerEmail').value,
        password: $('registerPassword').value,
      }),
    });
    setAuth(data.token, data.user);
    $('registerForm').reset();
    showApp();
    showToast('Welcome to Study Forge.');
  } catch (error) {
    showToast(error.message);
  }
});

$('logoutBtn').addEventListener('click', () => logout(true));

function logout(notify = true) {
  state.runningTimers.forEach((timer) => clearInterval(timer.interval));
  state.runningTimers.clear();
  clearAuth();
  $('appView').classList.add('hidden');
  $('authView').classList.remove('hidden');
  if (notify) showToast('Logged out.');
}

async function showApp() {
  $('authView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  $('userName').textContent = state.user?.name || 'Student';
  updateGreeting();
  updateClock();
  setTimeout(setupCanvas, 50);
  try {
    await Promise.all([loadNotes(), loadTimers()]);
  } catch (error) {
    showToast(error.message);
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  $('greeting').textContent = `${prefix}, ${state.user?.name?.split(' ')[0] || 'student'}.`;
  $('todayLabel').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
}

function updateClock() {
  $('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);

$('addNoteBtn').addEventListener('click', () => $('noteForm').classList.toggle('hidden'));
$('addTimerBtn').addEventListener('click', () => $('timerForm').classList.toggle('hidden'));

$('noteForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/notes', {
      method: 'POST',
      body: JSON.stringify({ title: $('noteTitle').value, content: $('noteContent').value, color: $('noteColor').value }),
    });
    event.target.reset();
    $('noteForm').classList.add('hidden');
    await loadNotes();
    showToast('Note saved.');
  } catch (error) {
    showToast(error.message);
  }
});

$('timerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/timers', {
      method: 'POST',
      body: JSON.stringify({ subject: $('timerSubject').value, minutes: Number($('timerMinutes').value) }),
    });
    event.target.reset();
    $('timerMinutes').value = 25;
    $('timerForm').classList.add('hidden');
    await loadTimers();
    showToast('Timer added.');
  } catch (error) {
    showToast(error.message);
  }
});

async function loadNotes() {
  const data = await api('/notes');
  state.notes = data.notes;
  $('noteCount').textContent = state.notes.length;
  renderNotes();
}

function renderNotes() {
  const list = $('notesList');
  $('emptyNotes').classList.toggle('hidden', state.notes.length > 0);
  list.innerHTML = state.notes.map((note) => `
    <article class="note-card" style="background:${escapeHtml(note.color)}">
      <h4>${escapeHtml(note.title)}</h4>
      <p>${escapeHtml(note.content || 'A blank page is still a page.').replace(/\n/g, '<br>')}</p>
      <div class="note-meta">
        <span>${new Date(note.createdAt).toLocaleDateString()}</span>
        <div class="note-actions">
          <button class="tiny-btn" data-action="edit-note" data-id="${note._id}">Edit</button>
          <button class="tiny-btn" data-action="delete-note" data-id="${note._id}">Delete</button>
        </div>
      </div>
    </article>
  `).join('');
}

$('notesList').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const note = state.notes.find((item) => item._id === button.dataset.id);
  if (!note) return;

  if (button.dataset.action === 'delete-note') {
    if (!confirm(`Delete “${note.title}”?`)) return;
    try { await api(`/notes/${note._id}`, { method: 'DELETE' }); await loadNotes(); showToast('Note deleted.'); } catch (error) { showToast(error.message); }
  }

  if (button.dataset.action === 'edit-note') {
    const title = prompt('Note title:', note.title);
    if (title === null) return;
    const content = prompt('Note content:', note.content || '');
    if (content === null) return;
    try {
      await api(`/notes/${note._id}`, { method: 'PUT', body: JSON.stringify({ title, content, color: note.color }) });
      await loadNotes();
      showToast('Note updated.');
    } catch (error) { showToast(error.message); }
  }
});

async function loadTimers() {
  const data = await api('/timers');
  state.timers = data.timers;
  $('timerCount').textContent = state.timers.length;
  renderTimers();
}

function renderTimers() {
  const list = $('timersList');
  $('emptyTimers').classList.toggle('hidden', state.timers.length > 0);
  list.innerHTML = state.timers.map((timer) => {
    const running = state.runningTimers.has(timer._id);
    const remaining = state.runningTimers.get(timer._id)?.remaining ?? timer.minutes * 60;
    return `
      <div class="timer-card">
        <div>
          <h4>${escapeHtml(timer.subject)}</h4>
          <p class="timer-display" id="display-${timer._id}">${formatTime(remaining)}</p>
          <div class="timer-actions">
            <button class="timer-btn start" data-action="toggle-timer" data-id="${timer._id}">${running ? 'Pause' : 'Start'}</button>
            <button class="timer-btn" data-action="reset-timer" data-id="${timer._id}">Reset</button>
            <button class="timer-btn" data-action="delete-timer" data-id="${timer._id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

$('timersList').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.dataset.id;
  const timer = state.timers.find((item) => item._id === id);
  if (!timer) return;

  if (button.dataset.action === 'toggle-timer') toggleTimer(timer);
  if (button.dataset.action === 'reset-timer') resetTimer(timer);
  if (button.dataset.action === 'delete-timer') {
    stopTimer(id);
    try { await api(`/timers/${id}`, { method: 'DELETE' }); await loadTimers(); showToast('Timer deleted.'); } catch (error) { showToast(error.message); }
  }
});

function toggleTimer(timer) {
  if (state.runningTimers.has(timer._id)) {
    stopTimer(timer._id);
    renderTimers();
    return;
  }

  const current = state.runningTimers.get(timer._id)?.remaining ?? timer.minutes * 60;
  const entry = { remaining: current, interval: null };
  entry.interval = setInterval(() => {
    entry.remaining -= 1;
    const display = document.getElementById(`display-${timer._id}`);
    if (display) display.textContent = formatTime(entry.remaining);

    if (entry.remaining <= 0) {
      stopTimer(timer._id);
      renderTimers();
      showToast(`${timer.subject} timer finished. Nice work.`);
      try { new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play(); } catch {}
    }
  }, 1000);

  state.runningTimers.set(timer._id, entry);
  renderTimers();
}

function stopTimer(id) {
  const timer = state.runningTimers.get(id);
  if (timer) clearInterval(timer.interval);
  state.runningTimers.delete(id);
}

function resetTimer(timer) {
  stopTimer(timer._id);
  renderTimers();
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60).toString().padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

const canvas = $('whiteboard');
const ctx = canvas.getContext('2d');
let drawing = false;
let lastPoint = null;

function setupCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  restoreBoard();
}

function boardPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function startDrawing(event) {
  drawing = true;
  lastPoint = boardPoint(event);
}
function draw(event) {
  if (!drawing || !lastPoint) return;
  const point = boardPoint(event);
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(point.x, point.y);
  ctx.strokeStyle = '#111';
  ctx.stroke();
  lastPoint = point;
  localStorage.setItem('studyForgeBoard', canvas.toDataURL('image/png'));
}
function stopDrawing() { drawing = false; lastPoint = null; }

canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointerleave', stopDrawing);
window.addEventListener('resize', () => { if (!document.hidden && !$('appView').classList.contains('hidden')) setupCanvas(); });

function restoreBoard() {
  const saved = localStorage.getItem('studyForgeBoard');
  if (!saved) return;
  const image = new Image();
  image.onload = () => {
    const rect = canvas.getBoundingClientRect();
    ctx.drawImage(image, 0, 0, rect.width, rect.height);
  };
  image.src = saved;
}

$('clearBoardBtn').addEventListener('click', () => {
  if (!confirm('Clear the whiteboard?')) return;
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  localStorage.removeItem('studyForgeBoard');
});

(async function boot() {
  if (!state.token || !state.user) return;
  try {
    const data = await api('/auth/me');
    state.user = data.user;
    localStorage.setItem('studyForgeUser', JSON.stringify(state.user));
    await showApp();
  } catch {
    clearAuth();
  }
})();
