const fs = require('fs');
const jsPath = 'C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js';

let js = fs.readFileSync(jsPath, 'utf8');

// Insert Phase 2 code before the closing })() of the IIFE
const iifeEnd = js.lastIndexOf('})()');
const insertPoint = js.lastIndexOf('\n', iifeEnd - 1);

const newCode = `

// ============================
// PHASE 2 — PROJECT WORKSPACES
// ============================

// Extend state
if (!state.projects) state.projects = [];
if (!state.notes) state.notes = [];
if (!state.canvasItems) state.canvasItems = [];
if (!state.activeProjectId) state.activeProjectId = null;
if (!state.activeNoteId) state.activeNoteId = null;
if (!state.projectCategories) state.projectCategories = ['arquitectura', 'fisica', 'universidad', 'personal'];
if (!state.notePinFilter) state.notePinFilter = false;

// Override persist/load to include new keys
const origLoadState = loadState;
loadState = function () {
  origLoadState();
  try {
    const pr = localStorage.getItem('arc_projects');
    if (pr) state.projects = JSON.parse(pr);
    const nt = localStorage.getItem('arc_notes');
    if (nt) state.notes = JSON.parse(nt);
    const cv = localStorage.getItem('arc_canvas');
    if (cv) state.canvasItems = JSON.parse(cv);
    const ap = localStorage.getItem('arc_active_project');
    if (ap) state.activeProjectId = ap;
    const an = localStorage.getItem('arc_active_note');
    if (an) state.activeNoteId = parseInt(an);
  } catch(e) { /* ignore */ }
  if (!state.projects) state.projects = [];
  if (!state.notes) state.notes = [];
  if (!state.canvasItems) state.canvasItems = [];
};

const origPersistState = persistState;
persistState = function () {
  origPersistState();
  try {
    localStorage.setItem('arc_projects', JSON.stringify(state.projects));
    localStorage.setItem('arc_notes', JSON.stringify(state.notes));
    localStorage.setItem('arc_canvas', JSON.stringify(state.canvasItems));
    localStorage.setItem('arc_active_project', state.activeProjectId || '');
    localStorage.setItem('arc_active_note', String(state.activeNoteId || ''));
  } catch(e) { /* ignore */ }
};

// ============================
// PROJECT CRUD
// ============================
let currentProjectFilter = 'all';
let projectSearchTerm = '';

function createProject(name, category, color) {
  const project = {
    id: 'proj_' + Date.now(),
    name: name || 'Nuevo proyecto',
    category: category || 'personal',
    color: color || '#42a5f5',
    pinned: false,
    archived: false,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    formulas: [],
    calculations: [],
    notes: [],
    graphs: []
  };
  state.projects.unshift(project);
  persistState();
  renderProjects();
  showToast('Proyecto creado');
  return project;
}

function renameProject(id, newName) {
  const p = state.projects.find(p => p.id === id);
  if (!p) return;
  p.name = newName;
  p.modified = new Date().toISOString();
  persistState();
  renderProjects();
}

function deleteProject(id) {
  if (!confirm('Eliminar proyecto? Esta accion no se puede deshacer.')) return;
  state.projects = state.projects.filter(p => p.id !== id);
  persistState();
  renderProjects();
  showToast('Proyecto eliminado');
}

function duplicateProject(id) {
  const p = state.projects.find(p => p.id === id);
  if (!p) return;
  const clone = JSON.parse(JSON.stringify(p));
  clone.id = 'proj_' + Date.now();
  clone.name = p.name + ' (copia)';
  clone.created = new Date().toISOString();
  clone.modified = new Date().toISOString();
  state.projects.unshift(clone);
  persistState();
  renderProjects();
  showToast('Proyecto duplicado');
}

function toggleProjectPin(id) {
  const p = state.projects.find(p => p.id === id);
  if (!p) return;
  p.pinned = !p.pinned;
  persistState();
  renderProjects();
}

function toggleProjectArchive(id) {
  const p = state.projects.find(p => p.id === id);
  if (!p) return;
  p.archived = !p.archived;
  persistState();
  renderProjects();
  showToast(p.archived ? 'Proyecto archivado' : 'Proyecto restaurado');
}

function getFilteredProjects() {
  let items = state.projects.filter(p => !p.archived);
  if (projectSearchTerm) {
    const t = projectSearchTerm.toLowerCase();
    items = items.filter(p =>
      p.name.toLowerCase().includes(t) ||
      p.category.toLowerCase().includes(t)
    );
  }
  if (currentProjectFilter !== 'all') {
    items = items.filter(p => p.category === currentProjectFilter);
  }
  items.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.modified) - new Date(a.modified);
  });
  return items;
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const empty = document.getElementById('projectsEmpty');
  if (!grid) return;

  const items = getFilteredProjects();
  if (items.length === 0) {
    grid.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';
  grid.style.display = 'grid';

  grid.innerHTML = items.map(p => {
    const pinColor = p.pinned ? 'var(--accent-light)' : 'var(--text-tertiary)';
    const stats = [];
    if (p.formulas && p.formulas.length) stats.push(p.formulas.length + ' formulas');
    stats.push('Creado: ' + new Date(p.created).toLocaleDateString('es-ES'));
    return '<div class="project-card" data-id="' + p.id + '">' +
      '<svg viewBox="0 0 24 24" class="project-card-pin' + (p.pinned ? ' pinned' : '') + '" data-action="pin" data-id="' + p.id + '"><path d="M16 11c0 1.66-1.34 3-3 3h-2v5h-2v-5H7v-3h2V6c0-1.66 1.34-3 3-3s3 1.34 3 3v5h2v3h-1z" fill="' + pinColor + '"/></svg>' +
      '<div class="project-card-color" style="background:' + p.color + '"></div>' +
      '<div class="project-card-name">' + escHtml(p.name) + '</div>' +
      '<div class="project-card-category">' + escHtml(p.category) + '</div>' +
      '<div class="project-card-stats">' + stats.map(s => '<span class="project-card-stat">' + s + '</span>').join('') + '</div>' +
      '<div class="project-card-actions">' +
        '<button class="project-card-action" data-action="rename" data-id="' + p.id + '">Renombrar</button>' +
        '<button class="project-card-action" data-action="duplicate" data-id="' + p.id + '">Duplicar</button>' +
        '<button class="project-card-action" data-action="archive" data-id="' + p.id + '">Archivar</button>' +
        '<button class="project-card-action danger" data-action="delete" data-id="' + p.id + '">Eliminar</button>' +
      '</div></div>';
  }).join('');
}

// ============================
// NOTES CRUD
// ============================
function createNote(title) {
  const note = {
    id: Date.now(),
    title: title || 'Nueva nota',
    content: '',
    pinned: false,
    projectId: state.activeProjectId,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  };
  state.notes.unshift(note);
  state.activeNoteId = note.id;
  persistState();
  renderNotesList();
  renderNoteEditor();
}

function saveNote(id, title, content) {
  const n = state.notes.find(n => n.id === id);
  if (!n) return;
  n.title = title || 'Sin titulo';
  n.content = content || '';
  n.modified = new Date().toISOString();
  persistState();
  renderNotesList();
  showToast('Nota guardada');
}

function deleteNote(id) {
  if (!confirm('Eliminar nota?')) return;
  state.notes = state.notes.filter(n => n.id !== id);
  if (state.activeNoteId === id) state.activeNoteId = null;
  persistState();
  renderNotesList();
  renderNoteEditor();
  showToast('Nota eliminada');
}

function toggleNotePin(id) {
  const n = state.notes.find(n => n.id === id);
  if (!n) return;
  n.pinned = !n.pinned;
  persistState();
  renderNotesList();
}

function getFilteredNotes(searchTerm) {
  let items = state.notes ? [...state.notes] : [];
  if (state.notePinFilter) {
    items = items.filter(n => n.pinned);
  }
  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    items = items.filter(n =>
      n.title.toLowerCase().includes(t) ||
      n.content.toLowerCase().includes(t)
    );
  }
  items.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.modified) - new Date(a.modified);
  });
  return items;
}

function renderNotesList() {
  const list = document.getElementById('notesList');
  const search = document.getElementById('notesSearchInput');
  if (!list) return;
  const term = search ? search.value : '';
  const items = getFilteredNotes(term);
  if (items.length === 0) {
    list.innerHTML = '<div class="notes-empty-list">' + (term ? 'Sin resultados' : 'Sin notas') + '</div>';
    return;
  }
  list.innerHTML = items.map(n => {
    const active = state.activeNoteId === n.id ? ' active' : '';
    const preview = n.content ? n.content.slice(0, 60) : '...';
    const date = new Date(n.modified).toLocaleDateString('es-ES');
    return '<div class="note-list-item' + active + '" data-id="' + n.id + '">' +
      '<div class="note-list-item-title">' + (n.pinned ? '\u{1F4CC} ' : '') + escHtml(n.title) + '</div>' +
      '<div class="note-list-item-preview">' + escHtml(preview) + '</div>' +
      '<div class="note-list-item-date">' + date + '</div></div>';
  }).join('');
}

function renderNoteEditor() {
  const empty = document.getElementById('notesEditorEmpty');
  const active = document.getElementById('notesEditorActive');
  if (!empty || !active) return;

  const note = state.notes ? state.notes.find(n => n.id === state.activeNoteId) : null;
  if (!note) {
    empty.style.display = 'flex';
    active.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  active.style.display = 'flex';
  document.getElementById('noteTitle').value = note.title || '';
  document.getElementById('noteContent').value = note.content || '';
  document.getElementById('noteMetaDate').textContent = new Date(note.modified).toLocaleString('es-ES');
  const proj = note.projectId ? state.projects.find(p => p.id === note.projectId) : null;
  document.getElementById('noteMetaProject').textContent = proj ? proj.name : 'Sin proyecto';
  const pinBtn = document.getElementById('notePinBtn');
  if (pinBtn) pinBtn.textContent = note.pinned ? 'Desfijar' : 'Fijar';
}

// ============================
// CANVAS
// ============================
let canvasZoom = 1;
let canvasState = { offsetX: 0, offsetY: 0 };
let canvasIsDragging = false;
let canvasDragItem = null;
let canvasDragStartX = 0, canvasDragStartY = 0;

function addCanvasItem(type, x, y) {
  const item = {
    id: 'cv_' + Date.now(),
    type: type,
    x: x || 100,
    y: y || 100,
    title: type === 'note' ? 'Nota' : type === 'formula' ? 'Formula' : 'Texto',
    content: type === 'note' ? 'Escribe aqui...' : type === 'formula' ? 'y = x' : 'Texto libre',
    width: 200,
    height: 120
  };
  state.canvasItems.push(item);
  persistState();
  renderCanvas();
}

function deleteCanvasItem(id) {
  state.canvasItems = state.canvasItems.filter(i => i.id !== id);
  persistState();
  renderCanvas();
}

function updateCanvasItemPosition(id, x, y) {
  const item = state.canvasItems.find(i => i.id === id);
  if (!item) return;
  item.x = x;
  item.y = y;
  persistState();
}

function renderCanvas() {
  const area = document.getElementById('canvasArea');
  const empty = document.getElementById('canvasEmpty');
  if (!area) return;

  if (state.canvasItems.length === 0) {
    area.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  const zoom = canvasZoom;
  const offX = canvasState.offsetX;
  const offY = canvasState.offsetY;

  area.innerHTML = state.canvasItems.map(item => {
    const x = (item.x * zoom) + offX;
    const y = (item.y * zoom) + offY;
    return '<div class="canvas-item" data-id="' + item.id + '" style="left:' + x + 'px;top:' + y + 'px;width:' + (item.width * zoom) + 'px">' +
      '<button class="canvas-item-delete" data-id="' + item.id + '" title="Eliminar">&times;</button>' +
      '<div class="canvas-item-title">' + escHtml(item.title) + '</div>' +
      '<div class="canvas-item-content">' + escHtml(item.content) + '</div></div>';
  }).join('');
}

// =============================
// EXPORT / PDF
// ============================
function openExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) modal.classList.add('open');
  updateExportPreview();
}

function closeExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) modal.classList.remove('open');
}

function updateExportPreview() {
  const options = document.querySelectorAll('.export-option');
  options.forEach(o => o.classList.remove('active'));
  const active = document.querySelector('.export-option');
  if (active) active.classList.add('active');
}

function exportToPDF(type) {
  showToast('Generando PDF...');
  document.body.classList.add('printing');
  setTimeout(() => {
    window.print();
    document.body.classList.remove('printing');
  }, 500);
  closeExportModal();
}

// ============================
// EVENT LISTENERS (attached in init)
// ============================
function initPhase2() {
  // --- PROJECTS ---
  const addProjBtn = document.getElementById('addProjectBtn');
  if (addProjBtn) {
    addProjBtn.addEventListener('click', () => {
      const name = prompt('Nombre del proyecto:');
      if (name) createProject(name);
    });
  }

  const emptyAddBtn = document.getElementById('emptyAddProject');
  if (emptyAddBtn) {
    emptyAddBtn.addEventListener('click', () => {
      const name = prompt('Nombre del proyecto:');
      if (name) createProject(name);
    });
  }

  const projSearch = document.getElementById('projectSearchInput');
  if (projSearch) {
    projSearch.addEventListener('input', (e) => {
      projectSearchTerm = e.target.value;
      renderProjects();
    });
  }

  document.querySelectorAll('.proj-filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.proj-filter-chip').forEach(b => b.classList.remove('active'));      btn.classList.add('active'));      currentProjectFilter = btn.dataset.filter;
      renderProjects();
    });
  });

  const projsGrid = document.getElementById('projectsGrid');
  if (projsGrid) {
    projsGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.project-card');
      const actionBtn = e.target.closest('.project-card-action');
      const pinBtn = e.target.closest('.project-card-pin');

      if (pinBtn) {
        e.stopPropagation();
        toggleProjectPin(pinBtn.dataset.id);
        return;
      }

      if (actionBtn) {
        e.stopPropagation();
        const id = actionBtn.dataset.id;
        const action = actionBtn.dataset.action;
        if (action === 'rename') {
          const newName = prompt('Nuevo nombre:');          if (newName) renameProject(id, newName);
        } else if (action === 'duplicate') {
          duplicateProject(id);
        } else if (action === 'archive') {
          toggleProjectArchive(id);
        } else if (action === 'delete') {
          deleteProject(id);
        }
        return;
      }

      if (card) {
        showToast('Proyecto: ' + card.querySelector('.project-card-name')?.textContent);
      }
    });
  }

/MORE BUGY CODE OMITTED FOR BREVITY...*/