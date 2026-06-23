const API_BASE = 'http://localhost:4000/api';
const el = (sel) => document.querySelector(sel);
const list = el('#taskList');
const empty = el('#emptyState');
const loading = el('#loading');

const searchInput = el('#searchInput');
const statusSelect = el('#statusSelect');
const reloadBtn = el('#reloadBtn');

const form = el('#newTaskForm');
const titleInput = el('#titleInput');
const dueDateInput = el('#dueDateInput');
const labelsInput = el('#labelsInput');

const toast = el('#toast');

// --- helpers ---
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—';
const parseLabels = (s) =>
  (s || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);

function showToast(msg, ms = 2200){
  toast.textContent = msg;
  toast.hidden = false;
  setTimeout(() => (toast.hidden = true), ms);
}

let state = { q: '', completed: '', items: [] };

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) {
    let err = 'Greška';
    try { const j = await res.json(); err = j.error || err; } catch {}
    throw new Error(err);
  }
  return res.status === 204 ? null : res.json();
}

// CRUD 
async function load() {
  loading.hidden = false;
  list.innerHTML = '';
  empty.hidden = true;

  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.completed !== '') params.set('completed', state.completed);

  try {
    const data = await api(`/tasks?${params.toString()}`);
    state.items = data;
    render();
  } catch (e) {
    showToast(e.message);
  } finally {
    loading.hidden = true;
  }
}

async function createTask(evt){
  evt.preventDefault();
  const title = titleInput.value.trim();
  if (title.length < 2) return showToast('Naslov min 2 znaka.');

  const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
  const labels = parseLabels(labelsInput.value);

  try {
    const created = await api('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, dueDate, labels })
    });
    state.items.unshift(created);
    render();
    form.reset();
    titleInput.focus();
  } catch (e) {
    showToast(e.message);
  }
}

async function toggleDone(id, checked){
  try {
    const updated = await api(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: checked })
    });
    const i = state.items.findIndex(x => x._id === id);
    if (i >= 0) state.items[i] = updated;
    renderRow(id);
  } catch (e) { showToast(e.message); }
}

async function updateTitle(id, newTitle){
  const title = newTitle.trim();
  if (title.length < 2) return showToast('Naslov min 2 znaka.');
  try {
    const updated = await api(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title })
    });
    const i = state.items.findIndex(x => x._id === id);
    if (i >= 0) state.items[i] = updated;
    renderRow(id);
  } catch (e) { showToast(e.message); }
}

async function removeTask(id){
  if (!confirm('Obrisati task?')) return;
  try {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    state.items = state.items.filter(x => x._id !== id);
    render();
  } catch (e) { showToast(e.message); }
}

function render(){
  list.innerHTML = '';
  if (!state.items.length){
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  for (const t of state.items){
    const li = document.createElement('li');
    li.className = `item ${t.completed ? 'done':''}`;
    li.dataset.id = t._id;

    li.innerHTML = `
      <div class="title">
        <input type="checkbox" ${t.completed ? 'checked':''} aria-label="Complete" />
        <span class="name" title="Klik za izmenu" contenteditable="false">${escapeHtml(t.title)}</span>
      </div>
      <div class="due">${fmtDate(t.dueDate)}</div>
      <div class="chips">${(t.labels||[]).map(l => `<span class="chip">${escapeHtml(l)}</span>`).join(' ') || '—'}</div>
      <div class="actions">
        <button class="edit ghost">Izmeni</button>
        <button class="del danger">Obriši</button>
      </div>
    `;
    list.appendChild(li);
  }
}

function renderRow(id){
  const t = state.items.find(x => x._id === id);
  if (!t) return render();
  const row = list.querySelector(`.item[data-id="${id}"]`);
  if (!row) return render();

  row.classList.toggle('done', !!t.completed);
  row.querySelector('.name').textContent = t.title;
  row.querySelector('.due').textContent = fmtDate(t.dueDate);
  row.querySelector('.chips').innerHTML =
    (t.labels || []).map(l => `<span class="chip">${escapeHtml(l)}</span>`).join(' ') || '—';
}

function escapeHtml(s){
  return (s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

form.addEventListener('submit', createTask);
reloadBtn.addEventListener('click', load);

let tmr;
searchInput.addEventListener('input', (e)=>{
  clearTimeout(tmr);
  tmr = setTimeout(()=>{
    state.q = e.target.value.trim();
    load();
  }, 300);
});

statusSelect.addEventListener('change', (e)=>{
  state.completed = e.target.value;
  load();
});

list.addEventListener('click', (e)=>{
  const row = e.target.closest('.item');
  if (!row) return;
  const id = row.dataset.id;

  if (e.target.matches('input[type="checkbox"]')){
    toggleDone(id, e.target.checked);
  }
  if (e.target.matches('.del')){
    removeTask(id);
  }
  if (e.target.matches('.edit')){
    const nameEl = row.querySelector('.name');
    nameEl.contentEditable = 'true';
    nameEl.focus();
    placeCaretAtEnd(nameEl);
    e.target.textContent = 'Sačuvaj';
    e.target.classList.remove('ghost');
    e.target.classList.add('ghost'); 

    const finish = async () => {
      nameEl.contentEditable = 'false';
      e.target.textContent = 'Izmeni';
      await updateTitle(id, nameEl.textContent || '');
      nameEl.removeEventListener('blur', onBlur);
      nameEl.removeEventListener('keydown', onKey);
    };
    const onBlur = () => finish();
    const onKey = (k) => {
      if (k.key === 'Enter'){ k.preventDefault(); finish(); }
      if (k.key === 'Escape'){ nameEl.textContent = state.items.find(x=>x._id===id).title; nameEl.blur(); }
    };
    nameEl.addEventListener('blur', onBlur);
    nameEl.addEventListener('keydown', onKey);
  }
});

function placeCaretAtEnd(el){
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// init
load();
