;(function() {
  'use strict';

  const arc = window.__arc;
  if (!arc) { console.error('Phase 2: ARC API not found'); return; }

  const state = arc.state;

  // ============================
  // EXTEND STATE
  // ============================
  if (!state.projects) state.projects = [];
  if (!state.notes) state.notes = [];
  if (!state.canvasItems) state.canvasItems = [];
  if (!state.activeProjectId) state.activeProjectId = null;
  if (!state.activeNoteId) state.activeNoteId = null;
  if (!state.projectCategories) state.projectCategories = ['arquitectura', 'fisica', 'universidad', 'personal'];
  if (state.notePinFilter === undefined) state.notePinFilter = false;

  // ============================
  // OVERRIDE PERSISTENCE
  // ============================
  arc.setLoadState(function() {
    arc._origLoadState();
    try {
      var pr = localStorage.getItem('arc_projects');
      if (pr) state.projects = JSON.parse(pr);
      var nt = localStorage.getItem('arc_notes');
      if (nt) state.notes = JSON.parse(nt);
      var cv = localStorage.getItem('arc_canvas');
      if (cv) state.canvasItems = JSON.parse(cv);
      var ap = localStorage.getItem('arc_active_project');
      if (ap) state.activeProjectId = ap;
      var an = localStorage.getItem('arc_active_note');
      if (an) state.activeNoteId = parseFloat(an);
    } catch(e) {}
    if (!state.projects) state.projects = [];
    if (!state.notes) state.notes = [];
    if (!state.canvasItems) state.canvasItems = [];
  });

  arc.setPersistState(function() {
    arc._origPersistState();
    try {
      localStorage.setItem('arc_projects', JSON.stringify(state.projects));
      localStorage.setItem('arc_notes', JSON.stringify(state.notes));
      localStorage.setItem('arc_canvas', JSON.stringify(state.canvasItems));
      localStorage.setItem('arc_active_project', state.activeProjectId || '');
      localStorage.setItem('arc_active_note', String(state.activeNoteId || ''));
    } catch(e) {}
  });

  var _persistState = function() { arc.persistState(); };

  // ============================
  // HELPERS
  // ============================
  function escHtml(s) {
    if (typeof s !== 'string') return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function genId() { return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }

  // ============================
  // 1. PROJECT WORKSPACES
  // ============================
  var currentProjectFilter = 'all';
  var projectSearchTerm = '';
  var projectView = 'grid';

  function createProject(name, category, color) {
    var project = {
      id: 'proj_' + genId(),
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
    _persistState();
    renderProjects();
    arc.showToast('Proyecto creado');
    return project;
  }

  function renameProject(id, newName) {
    var p = state.projects.find(function(p) { return p.id === id; });
    if (!p) return;
    p.name = newName;
    p.modified = new Date().toISOString();
    _persistState();
    renderProjects();
  }

  function deleteProject(id) {
    arc.showConfirm('Eliminar proyecto', 'Esta acción no se puede deshacer.').then(function(confirmed) {
      if (!confirmed) return;
      state.projects = state.projects.filter(function(p) { return p.id !== id; });
      if (state.activeProjectId === id) state.activeProjectId = null;
      _persistState();
      renderProjects();
      arc.showToast('Proyecto eliminado');
    });
  }

  function duplicateProject(id) {
    var p = state.projects.find(function(p) { return p.id === id; });
    if (!p) return;
    var clone = JSON.parse(JSON.stringify(p));
    clone.id = 'proj_' + genId();
    clone.name = p.name + ' (copia)';
    clone.created = new Date().toISOString();
    clone.modified = new Date().toISOString();
    state.projects.unshift(clone);
    _persistState();
    renderProjects();
    arc.showToast('Proyecto duplicado');
  }

  function toggleProjectPin(id) {
    var p = state.projects.find(function(p) { return p.id === id; });
    if (!p) return;
    p.pinned = !p.pinned;
    _persistState();
    renderProjects();
  }

  function toggleProjectArchive(id) {
    var p = state.projects.find(function(p) { return p.id === id; });
    if (!p) return;
    p.archived = !p.archived;
    _persistState();
    renderProjects();
    arc.showToast(p.archived ? 'Proyecto archivado' : 'Proyecto restaurado');
  }

  function getFilteredProjects() {
    var items = state.projects.filter(function(p) { return !p.archived; });
    if (projectSearchTerm) {
      var t = projectSearchTerm.toLowerCase();
      items = items.filter(function(p) {
        return p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t);
      });
    }
    if (currentProjectFilter !== 'all') {
      items = items.filter(function(p) { return p.category === currentProjectFilter; });
    }
    items.sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.modified) - new Date(a.modified);
    });
    return items;
  }

  function openProjectDashboard(id) {
    state.activeProjectId = id;
    _persistState();
    renderProjectDashboard();
  }

  function closeProjectDashboard() {
    state.activeProjectId = null;
    _persistState();
    renderProjects();
  }

  function renderProjectDashboard() {
    var p = state.projects.find(function(p) { return p.id === state.activeProjectId; });
    if (!p) { renderProjects(); return; }

    var container = document.querySelector('.projects-container');
    if (!container) return;

    var calcCount = p.calculations ? p.calculations.length : 0;
    var formulaCount = p.formulas ? p.formulas.length : 0;
    var noteCount = p.notes ? p.notes.length : 0;
    var graphCount = p.graphs ? p.graphs.length : 0;

    container.innerHTML = 
      '<div class="project-dashboard glass">' +
        '<div class="project-dash-header">' +
          '<button class="project-dash-back" id="projectDashBack">' +
            '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>' +
          '</button>' +
          '<div class="project-dash-info">' +
            '<h2 class="project-dash-name">' + escHtml(p.name) + '</h2>' +
            '<span class="project-dash-category" style="color:' + p.color + '">' + escHtml(p.category) + '</span>' +
          '</div>' +
          '<div class="project-dash-stats-bar">' +
            '<div class="project-dash-stat"><span class="pds-value">' + calcCount + '</span><span class="pds-label">Cálculos</span></div>' +
            '<div class="project-dash-stat"><span class="pds-value">' + formulaCount + '</span><span class="pds-label">Fórmulas</span></div>' +
            '<div class="project-dash-stat"><span class="pds-value">' + noteCount + '</span><span class="pds-label">Notas</span></div>' +
            '<div class="project-dash-stat"><span class="pds-value">' + graphCount + '</span><span class="pds-label">Gráficos</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="project-dash-actions">' +
          '<button class="dash-action" data-action="escalas" style="--accent-c:#42a5f5"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 2h10a3 3 0 013 3v14a3 3 0 01-3 3H7a3 3 0 01-3-3V5a3 3 0 013-3z" fill="currentColor"/></svg></div><span>Nuevo cálculo</span></button>' +
          '<button class="dash-action" data-action="nueva-formula" style="--accent-c:#ab47bc"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor"/></svg></div><span>Nueva fórmula</span></button>' +
          '<button class="dash-action" data-action="nueva-nota" style="--accent-c:#66bb6a"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z" fill="currentColor"/></svg></div><span>Nueva nota</span></button>' +
          '<button class="dash-action" data-action="graficos" style="--accent-c:#ffa726"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 3v18h18v-2H5V3H3z" fill="currentColor"/></svg></div><span>Graficar</span></button>' +
          '<button class="dash-action" data-action="canvas" style="--accent-c:#26a69a"><div class="dash-action-icon"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14z" fill="currentColor"/></svg></div><span>Abrir canvas</span></button>' +
        '</div>' +
        '<div class="project-dash-content">' +
          '<div class="project-dash-section"><h3 class="project-dash-section-title">Cálculos recientes</h3><div class="project-dash-list" id="projRecentCalcs">' +
            (calcCount > 0 ? p.calculations.slice(0, 5).map(function(c) { 
              return '<div class="project-dash-item"><span class="pdi-result">' + escHtml(c.result || '—') + '</span><span class="pdi-label">' + escHtml(c.formula || '') + '</span></div>';
            }).join('') : '<div class="project-dash-empty">Sin cálculos aún</div>') +
          '</div></div>' +
          '<div class="project-dash-section"><h3 class="project-dash-section-title">Fórmulas</h3><div class="project-dash-list" id="projFormulas">' +
            (formulaCount > 0 ? p.formulas.slice(0, 5).map(function(f) {
              return '<div class="project-dash-item"><span class="pdi-label">' + escHtml(f.name || f.expr || '') + '</span></div>';
            }).join('') : '<div class="project-dash-empty">Sin fórmulas aún</div>') +
          '</div></div>' +
          '<div class="project-dash-section"><h3 class="project-dash-section-title">Notas recientes</h3><div class="project-dash-list" id="projNotes">' +
            (noteCount > 0 ? p.notes.slice(0, 5).map(function(n) {
              return '<div class="project-dash-item"><span class="pdi-label">' + escHtml(n.title || n.content || '') + '</span></div>';
            }).join('') : '<div class="project-dash-empty">Sin notas aún</div>') +
          '</div></div>' +
        '</div>' +
      '</div>';

    container.querySelector('#projectDashBack').addEventListener('click', closeProjectDashboard);
    container.querySelectorAll('.project-dash-actions .dash-action').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var action = btn.dataset.action;
        if (action === 'nueva-formula') {
          var modal = document.getElementById('formulaModal');
          if (modal) modal.classList.add('open');
        } else if (action === 'nueva-nota') {
          createNote();
        } else {
          arc.navigateTo(action);
        }
      });
    });
  }

  function renderProjects() {
    var grid = document.getElementById('projectsGrid');
    var empty = document.getElementById('projectsEmpty');
    var container = document.querySelector('.projects-container');
    if (!grid || !container) return;

    if (state.activeProjectId) {
      renderProjectDashboard();
      return;
    }

    var items = getFilteredProjects();
    if (items.length === 0) {
      grid.style.display = 'none';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = items.map(function(p) {
      var pinColor = p.pinned ? 'var(--accent-light)' : 'var(--text-tertiary)';
      var createdDate = new Date(p.created).toLocaleDateString('es-ES');
      var calcCount = p.calculations ? p.calculations.length : 0;
      var formulaCount = p.formulas ? p.formulas.length : 0;
      return '<div class="project-card" data-id="' + p.id + '">' +
        '<div class="project-card-top">' +
          '<div class="project-card-color" style="background:' + p.color + '"></div>' +
          '<button class="project-card-pin-btn' + (p.pinned ? ' pinned' : '') + '" data-action="pin" data-id="' + p.id + '">' +
            '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 11c0 1.66-1.34 3-3 3h-2v5h-2v-5H7v-3h2V6c0-1.66 1.34-3 3-3s3 1.34 3 3v5h2v3h-1z" fill="' + pinColor + '"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="project-card-body">' +
          '<div class="project-card-name">' + escHtml(p.name) + '</div>' +
          '<div class="project-card-category">' + escHtml(p.category) + '</div>' +
          '<div class="project-card-stats">' +
            '<span class="project-card-stat">' + calcCount + ' cálc.</span>' +
            '<span class="project-card-stat">' + formulaCount + ' fórm.</span>' +
            '<span class="project-card-stat">' + createdDate + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="project-card-actions">' +
          '<button class="project-card-action" data-action="rename" data-id="' + p.id + '">Renombrar</button>' +
          '<button class="project-card-action" data-action="duplicate" data-id="' + p.id + '">Duplicar</button>' +
          '<button class="project-card-action" data-action="archive" data-id="' + p.id + '">Archivar</button>' +
          '<button class="project-card-action danger" data-action="delete" data-id="' + p.id + '">Eliminar</button>' +
        '</div></div>';
    }).join('');
  }

  // ============================
  // 2. NOTES SYSTEM
  // ============================
  function createNote(title) {
    var note = {
      id: Date.now(),
      title: title || 'Nueva nota',
      content: '',
      pinned: false,
      projectId: state.activeProjectId,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      blocks: []
    };
    state.notes.unshift(note);
    state.activeNoteId = note.id;
    _persistState();
    renderNotesList();
    renderNoteEditor();
    arc.navigateTo('notas');
  }

  function saveNote(id, title, content) {
    var n = state.notes.find(function(n) { return n.id === id; });
    if (!n) return;
    n.title = title || 'Sin título';
    n.content = content || '';
    n.modified = new Date().toISOString();
    _persistState();
    renderNotesList();
    arc.showToast('Nota guardada');
  }

  function deleteNote(id) {
    arc.showConfirm('Eliminar nota', '¿Eliminar esta nota? Esta acción no se puede deshacer.').then(function(confirmed) {
      if (!confirmed) return;
      state.notes = state.notes.filter(function(n) { return n.id !== id; });
      if (state.activeNoteId === id) state.activeNoteId = null;
      _persistState();
      renderNotesList();
      renderNoteEditor();
      arc.showToast('Nota eliminada');
    });
  }

  function toggleNotePin(id) {
    var n = state.notes.find(function(n) { return n.id === id; });
    if (!n) return;
    n.pinned = !n.pinned;
    _persistState();
    renderNotesList();
  }

  function getFilteredNotes(searchTerm) {
    var items = state.notes ? state.notes.slice() : [];
    if (state.notePinFilter) {
      items = items.filter(function(n) { return n.pinned; });
    }
    if (searchTerm) {
      var t = searchTerm.toLowerCase();
      items = items.filter(function(n) {
        return n.title.toLowerCase().includes(t) || n.content.toLowerCase().includes(t);
      });
    }
    items.sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.modified) - new Date(a.modified);
    });
    return items;
  }

  function renderNotesList() {
    var list = document.getElementById('notesList');
    var search = document.getElementById('notesSearchInput');
    if (!list) return;
    var term = search ? search.value : '';
    var items = getFilteredNotes(term);
    if (items.length === 0) {
      list.innerHTML = '<div class="notes-empty-list">' + (term ? 'Sin resultados' : 'Sin notas') + '</div>';
      return;
    }
    list.innerHTML = items.map(function(n) {
      var active = state.activeNoteId === n.id ? ' active' : '';
      var preview = n.content ? n.content.replace(/<[^>]+>/g, '').slice(0, 60) : '...';
      var date = new Date(n.modified).toLocaleDateString('es-ES');
      return '<div class="note-list-item' + active + '" data-id="' + n.id + '">' +
        '<div class="note-list-item-title">' + (n.pinned ? '\u{1F4CC} ' : '') + escHtml(n.title) + '</div>' +
        '<div class="note-list-item-preview">' + escHtml(preview) + '</div>' +
        '<div class="note-list-item-date">' + date + '</div></div>';
    }).join('');
  }

  function renderNoteEditor() {
    var empty = document.getElementById('notesEditorEmpty');
    var active = document.getElementById('notesEditorActive');
    if (!empty || !active) return;

    var note = state.notes ? state.notes.find(function(n) { return n.id === state.activeNoteId; }) : null;
    if (!note) {
      empty.style.display = 'flex';
      active.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    active.style.display = 'flex';
    var titleEl = document.getElementById('noteTitle');
    if (titleEl) titleEl.value = note.title || '';
    var contentEl = document.getElementById('noteContent');
    if (contentEl) contentEl.value = note.content || '';
    var metaDate = document.getElementById('noteMetaDate');
    if (metaDate) metaDate.textContent = new Date(note.modified).toLocaleString('es-ES');
    var proj = note.projectId ? state.projects.find(function(p) { return p.id === note.projectId; }) : null;
    var metaProj = document.getElementById('noteMetaProject');
    if (metaProj) metaProj.textContent = proj ? proj.name : 'Sin proyecto';
    var pinBtn = document.getElementById('notePinBtn');
    if (pinBtn) pinBtn.textContent = note.pinned ? 'Desfijar' : 'Fijar';
  }

  // ============================
  // 3. CANVAS WORKSPACE
  // ============================
  var canvasZoom = 1;
  var canvasPanX = 0;
  var canvasPanY = 0;
  var canvasIsPanning = false;
  var canvasPanStartX = 0;
  var canvasPanStartY = 0;
  var canvasPanStartOffsetX = 0;
  var canvasPanStartOffsetY = 0;
  var canvasDragItem = null;
  var canvasDragItemStartX = 0;
  var canvasDragItemStartY = 0;
  var canvasDragMouseStartX = 0;
  var canvasDragMouseStartY = 0;
  var canvasInertiaX = 0;
  var canvasInertiaY = 0;
  var canvasInertiaInterval = null;
  var canvasSnapGrid = 20;

  function addCanvasItem(type, x, y) {
    var item = {
      id: 'cv_' + genId(),
      type: type,
      x: x || 100,
      y: y || 100,
      title: type === 'note' ? 'Nota' : type === 'formula' ? 'Fórmula' : type === 'graph' ? 'Gráfico' : 'Texto',
      content: type === 'note' ? 'Escribe aquí...' : type === 'formula' ? 'y = x' : type === 'graph' ? 'sin(x)' : 'Texto libre',
      width: 220,
      height: type === 'graph' ? 180 : 120,
      color: '#42a5f5'
    };
    state.canvasItems.push(item);
    _persistState();
    renderCanvas();
  }

  function deleteCanvasItem(id) {
    state.canvasItems = state.canvasItems.filter(function(i) { return i.id !== id; });
    _persistState();
    renderCanvas();
  }

  function updateCanvasItemPosition(id, x, y) {
    var item = state.canvasItems.find(function(i) { return i.id === id; });
    if (!item) return;
    item.x = x;
    item.y = y;
  }

  function updateCanvasItemContent(id, content) {
    var item = state.canvasItems.find(function(i) { return i.id === id; });
    if (!item) return;
    item.content = content;
    _persistState();
    renderCanvas();
  }

  function updateCanvasZoomLabel() {
    var label = document.getElementById('canvasZoomLabel');
    if (label) label.textContent = Math.round(canvasZoom * 100) + '%';
  }

  function applyCanvasTransform(area) {
    if (!area) area = document.getElementById('canvasArea');
    if (!area) return;
    area.style.transform = 'translate(' + canvasPanX + 'px, ' + canvasPanY + 'px) scale(' + canvasZoom + ')';
    area.style.transformOrigin = '0 0';
  }

  function renderCanvas() {
    var area = document.getElementById('canvasArea');
    var empty = document.getElementById('canvasEmpty');
    if (!area) return;

    if (state.canvasItems.length === 0) {
      area.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      applyCanvasTransform(area);
      return;
    }
    if (empty) empty.style.display = 'none';

    applyCanvasTransform(area);

    area.innerHTML = state.canvasItems.map(function(item) {
      var iconSvg = '';
      if (item.type === 'note') iconSvg = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z" fill="currentColor"/></svg>';
      else if (item.type === 'formula') iconSvg = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg>';
      else if (item.type === 'graph') iconSvg = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 3v18h18v-2H5V3H3z" fill="currentColor"/></svg>';
      else iconSvg = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z" fill="currentColor"/></svg>';
      return '<div class="canvas-item" data-id="' + item.id + '" style="left:' + item.x + 'px;top:' + item.y + 'px;width:' + item.width + 'px">' +
        '<div class="canvas-item-header">' +
          '<span class="canvas-item-type-icon">' + iconSvg + '</span>' +
          '<span class="canvas-item-title">' + escHtml(item.title) + '</span>' +
          '<button class="canvas-item-delete" data-id="' + item.id + '" title="Eliminar">&times;</button>' +
        '</div>' +
        '<div class="canvas-item-body" data-id="' + item.id + '">' +
          (item.type === 'graph' 
            ? '<div class="canvas-item-graph-mini" data-id="' + item.id + '" data-expr="' + escHtml(item.content) + '"><canvas width="200" height="140"></canvas></div>'
            : '<div class="canvas-item-text">' + escHtml(item.content) + '</div>') +
        '</div></div>';
    }).join('');

    // Render mini graphs
    area.querySelectorAll('.canvas-item-graph-mini').forEach(function(el) {
      renderCanvasMiniGraph(el);
    });

    area.querySelectorAll('.canvas-item-body').forEach(function(el) {
      el.addEventListener('dblclick', function() {
        var id = el.dataset.id;
        var item = state.canvasItems.find(function(i) { return i.id === id; });
        if (!item) return;
        arc.showPrompt('Editar contenido', { label: 'Contenido', value: item.content, placeholder: 'Nuevo contenido...' }).then(function(newContent) {
          if (newContent !== null) updateCanvasItemContent(id, newContent);
        });
      });
    });
  }

  function renderCanvasMiniGraph(container) {
    var canvas = container.querySelector('canvas');
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.offsetWidth || 200;
    var h = canvas.offsetHeight || 140;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);

    var expr = container.dataset.expr || 'sin(x)';
    var xMin = -5, xMax = 5, yMin = -5, yMax = 5;
    var pad = 10;
    var plotW = w - pad * 2;
    var plotH = h - pad * 2;
    var x2p = function(x) { return pad + ((x - xMin) / (xMax - xMin)) * plotW; };
    var y2p = function(y) { return pad + ((yMax - y) / (yMax - yMin)) * plotH; };

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (var i = -4; i <= 4; i += 2) {
      ctx.beginPath(); ctx.moveTo(x2p(i), pad); ctx.lineTo(x2p(i), h - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, y2p(i)); ctx.lineTo(w - pad, y2p(i)); ctx.stroke();
    }

    try {
      var parsed = expr
        .replace(/\^/g, '**').replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(').replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(').replace(/pi/gi, 'Math.PI');
      var compiled = new Function('x', '"use strict"; return ' + parsed);
      ctx.strokeStyle = 'rgba(66,165,245,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var started = false;
      for (var i = 0; i <= 80; i++) {
        var x = xMin + (i / 80) * (xMax - xMin);
        var y = compiled(x);
        if (isFinite(y) && y > -10 && y < 10) {
          var px = x2p(x), py = y2p(y);
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        } else { started = false; }
      }
      ctx.stroke();
    } catch(e) {}
  }

  // ============================
  // 4. PDF EXPORT
  // ============================
  var exportType = 'project';

  function openExportModal() {
    var modal = document.getElementById('exportModal');
    if (modal) modal.classList.add('open');
  }

  function closeExportModal() {
    var modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('open');
  }

  function exportToPDF(type) {
    arc.showLoading('Generando PDF...');

    var printContent = '';
    var title = 'ARC - Exportación';

    if (type === 'project' || type === 'all') {
      var proj = state.activeProjectId ? state.projects.find(function(p) { return p.id === state.activeProjectId; }) : null;
      if (proj) {
        title = proj.name;
        printContent += '<h1>' + escHtml(proj.name) + '</h1>';
        printContent += '<p class="print-meta">Categoría: ' + escHtml(proj.category) + ' | Creado: ' + new Date(proj.created).toLocaleDateString('es-ES') + '</p>';
        if (proj.calculations && proj.calculations.length > 0) {
          printContent += '<h2>Cálculos</h2><ul>' + proj.calculations.map(function(c) {
            return '<li>' + escHtml(c.formula || '') + ' = <strong>' + escHtml(c.result || '') + '</strong></li>';
          }).join('') + '</ul>';
        }
        if (proj.formulas && proj.formulas.length > 0) {
          printContent += '<h2>Fórmulas</h2><ul>' + proj.formulas.map(function(f) {
            return '<li><strong>' + escHtml(f.name || '') + '</strong>: y = ' + escHtml(f.expr || '') + '</li>';
          }).join('') + '</ul>';
        }
        if (proj.notes && proj.notes.length > 0) {
          printContent += '<h2>Notas</h2>' + proj.notes.map(function(n) {
            return '<div class="print-note"><h3>' + escHtml(n.title || '') + '</h3><p>' + escHtml(n.content || '') + '</p></div>';
          }).join('');
        }
      } else {
        printContent += '<h1>ARC — Todos los proyectos</h1>';
        printContent += '<ul>' + state.projects.map(function(p) {
          return '<li><strong>' + escHtml(p.name) + '</strong> (' + escHtml(p.category) + ')</li>';
        }).join('') + '</ul>';
      }
    }

    if (type === 'notes') {
      printContent += '<h1>Notas</h1>';
      state.notes.forEach(function(n) {
        printContent += '<div class="print-note"><h2>' + escHtml(n.title) + '</h2><p>' + escHtml(n.content) + '</p></div>';
      });
    }

    if (type === 'formulas') {
      printContent += '<h1>Fórmulas</h1>';
      state.formulas.forEach(function(f) {
        printContent += '<div class="print-formula"><strong>' + escHtml(f.name) + '</strong>: y = ' + escHtml(f.expr) + '</div>';
      });
    }

    var printWin = window.open('', '_blank', 'width=800,height=600');
    if (!printWin) { arc.hideLoading(); arc.showToast('Permite ventanas emergentes para exportar'); return; }

    printWin.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escHtml(title) + '</title>' +
      '<style>' +
        '@page { margin: 20mm 15mm; }' +
        'body { font-family: "Inter", -apple-system, sans-serif; color: #111; line-height: 1.6; padding: 0; margin: 0; }' +
        'h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; color: #000; }' +
        'h2 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }' +
        'h3 { font-size: 15px; font-weight: 600; margin-bottom: 2px; }' +
        'p { margin: 4px 0; }' +
        '.print-meta { color: #666; font-size: 13px; margin-bottom: 16px; }' +
        'ul { padding-left: 20px; margin: 8px 0; }' +
        'li { margin-bottom: 4px; font-size: 13px; }' +
        '.print-note { margin-bottom: 16px; page-break-inside: avoid; }' +
        '.print-note p { font-size: 13px; color: #333; }' +
        '.print-formula { margin-bottom: 8px; font-size: 13px; }' +
        '.print-footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }' +
        '@media print { body { padding: 0; } }' +
      '</style></head><body>' +
      printContent +
      '<div class="print-footer">Generado por ARC — ' + new Date().toLocaleString('es-ES') + '</div>' +
      '</body></html>'
    );
    printWin.document.close();
    setTimeout(function() { arc.hideLoading(); printWin.focus(); printWin.print(); }, 500);
    closeExportModal();
    arc.showToast('PDF generado');
  }

  // ============================
  // 5. INIT PHASE 2
  // ============================
  function initPhase2() {
    // Projects
    var addProjBtn = document.getElementById('addProjectBtn');
    if (addProjBtn) {
      addProjBtn.addEventListener('click', function() {
        arc.showPrompt('Nuevo proyecto', { label: 'Nombre del proyecto', placeholder: 'ej: Casa habitación' }).then(function(name) {
          if (name && name.trim()) createProject(name.trim());
          else if (name === '') arc.showToast('El nombre no puede estar vacío');
        });
      });
    }

    var emptyAddBtn = document.getElementById('emptyAddProject');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', function() {
        arc.showPrompt('Nuevo proyecto', { label: 'Nombre del proyecto', placeholder: 'ej: Casa habitación' }).then(function(name) {
          if (name && name.trim()) createProject(name.trim());
          else if (name === '') arc.showToast('El nombre no puede estar vacío');
        });
      });
    }

    var projSearch = document.getElementById('projectSearchInput');
    if (projSearch) {
      projSearch.addEventListener('input', function(e) {
        projectSearchTerm = e.target.value;
        renderProjects();
      });
    }

    var filterChips = document.querySelectorAll('.proj-filter-chip');
    filterChips.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filterChips.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentProjectFilter = btn.dataset.filter;
        renderProjects();
      });
    });

    var projsGrid = document.getElementById('projectsGrid');
    if (projsGrid) {
      projsGrid.addEventListener('click', function(e) {
        var card = e.target.closest('.project-card');
        var actionBtn = e.target.closest('.project-card-action');
        var pinBtn = e.target.closest('.project-card-pin-btn');

        if (pinBtn) {
          e.stopPropagation();
          toggleProjectPin(pinBtn.dataset.id);
          return;
        }

        if (actionBtn) {
          e.stopPropagation();
          var id = actionBtn.dataset.id;
          var action = actionBtn.dataset.action;
          if (action === 'rename') {
            arc.showPrompt('Renombrar proyecto', { label: 'Nuevo nombre', value: '', placeholder: 'Nombre del proyecto' }).then(function(newName) {
              if (newName && newName.trim()) renameProject(id, newName.trim());
            });
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
          openProjectDashboard(card.dataset.id);
        }
      });
    }

    // Notes
    var addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) addNoteBtn.addEventListener('click', function() { createNote(); });

    var notesList = document.getElementById('notesList');
    if (notesList) {
      notesList.addEventListener('click', function(e) {
        var item = e.target.closest('.note-list-item');
        if (item) {
          state.activeNoteId = parseInt(item.dataset.id);
          renderNoteEditor();
          renderNotesList();
          _persistState();
        }
      });
    }

    var noteSaveBtn = document.getElementById('noteSaveBtn');
    if (noteSaveBtn) {
      noteSaveBtn.addEventListener('click', function() {
        var id = state.activeNoteId;
        var title = document.getElementById('noteTitle') ? document.getElementById('noteTitle').value : '';
        var content = document.getElementById('noteContent') ? document.getElementById('noteContent').value : '';
        if (id) saveNote(id, title, content);
      });
    }

    var noteDeleteBtn = document.getElementById('noteDeleteBtn');
    if (noteDeleteBtn) {
      noteDeleteBtn.addEventListener('click', function() {
        if (state.activeNoteId) deleteNote(state.activeNoteId);
      });
    }

    var notePinBtn = document.getElementById('notePinBtn');
    if (notePinBtn) {
      notePinBtn.addEventListener('click', function() {
        if (state.activeNoteId) toggleNotePin(state.activeNoteId);
      });
    }

    var notesSearchInput = document.getElementById('notesSearchInput');
    if (notesSearchInput) {
      notesSearchInput.addEventListener('input', function() {
        renderNotesList();
      });
    }

    var notesPinFilter = document.getElementById('notesPinFilter');
    if (notesPinFilter) {
      notesPinFilter.addEventListener('click', function() {
        state.notePinFilter = !state.notePinFilter;
        notesPinFilter.classList.toggle('active', state.notePinFilter);
        renderNotesList();
      });
    }

    // Canvas
    var canvasToolBtns = document.querySelectorAll('.canvas-tool-btn');
    canvasToolBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tool = btn.dataset.tool;
        addCanvasItem(tool, 80 + Math.random() * 200, 80 + Math.random() * 200);
      });
    });

    var zoomIn = document.getElementById('canvasZoomIn');
    if (zoomIn) {
      zoomIn.addEventListener('click', function() {
        canvasZoom = Math.min(canvasZoom * 1.3, 5);
        updateCanvasZoomLabel();
        renderCanvas();
      });
    }

    var zoomOut = document.getElementById('canvasZoomOut');
    if (zoomOut) {
      zoomOut.addEventListener('click', function() {
        canvasZoom = Math.max(canvasZoom / 1.3, 0.2);
        updateCanvasZoomLabel();
        renderCanvas();
      });
    }

    var zoomReset = document.getElementById('canvasReset');
    if (zoomReset) {
      zoomReset.addEventListener('click', function() {
        canvasZoom = 1;
        canvasPanX = 0;
        canvasPanY = 0;
        updateCanvasZoomLabel();
        renderCanvas();
      });
    }

    // Canvas workspace pan + item drag
    var workspace = document.getElementById('canvasWorkspace');
    if (workspace) {
      workspace.addEventListener('mousedown', function(e) {
        var item = e.target.closest('.canvas-item');
        if (item) {
          canvasDragItem = item.dataset.id;
          var ci = state.canvasItems.find(function(i) { return i.id === canvasDragItem; });
          if (ci) {
            canvasDragItemStartX = ci.x;
            canvasDragItemStartY = ci.y;
            canvasDragMouseStartX = e.clientX;
            canvasDragMouseStartY = e.clientY;
          }
          e.preventDefault();
          return;
        }

        if (e.target.closest('.canvas-toolbar') || e.target.closest('.canvas-item-delete') || e.target.closest('.canvas-item-header')) return;

        canvasIsPanning = true;
        canvasPanStartX = e.clientX;
        canvasPanStartY = e.clientY;
        canvasPanStartOffsetX = canvasPanX;
        canvasPanStartOffsetY = canvasPanY;
        if (canvasInertiaInterval) { clearInterval(canvasInertiaInterval); canvasInertiaInterval = null; }
        canvasInertiaX = 0;
        canvasInertiaY = 0;
        e.preventDefault();
      });

      workspace.addEventListener('mousemove', function(e) {
        if (canvasDragItem) {
          var dx = (e.clientX - canvasDragMouseStartX) / canvasZoom;
          var dy = (e.clientY - canvasDragMouseStartY) / canvasZoom;
          var newX = canvasDragItemStartX + dx;
          var newY = canvasDragItemStartY + dy;
          var ci = state.canvasItems.find(function(i) { return i.id === canvasDragItem; });
          if (ci) {
            ci.x = Math.round(newX / canvasSnapGrid) * canvasSnapGrid;
            ci.y = Math.round(newY / canvasSnapGrid) * canvasSnapGrid;
            renderCanvas();
          }
          return;
        }

        if (!canvasIsPanning) return;
        var dx = e.clientX - canvasPanStartX;
        var dy = e.clientY - canvasPanStartY;
        canvasPanX = canvasPanStartOffsetX + dx;
        canvasPanY = canvasPanStartOffsetY + dy;
        canvasInertiaX = dx;
        canvasInertiaY = dy;
        renderCanvas();
      });

      var endCanvasDrag = function() {
        if (canvasDragItem) {
          _persistState();
          canvasDragItem = null;
        }
        if (canvasIsPanning) {
          canvasIsPanning = false;
          if (Math.abs(canvasInertiaX) > 5 || Math.abs(canvasInertiaY) > 5) {
            if (canvasInertiaInterval) clearInterval(canvasInertiaInterval);
            canvasInertiaInterval = setInterval(function() {
              canvasInertiaX *= 0.92;
              canvasInertiaY *= 0.92;
              canvasPanX += canvasInertiaX;
              canvasPanY += canvasInertiaY;
              renderCanvas();
              if (Math.abs(canvasInertiaX) < 0.5 && Math.abs(canvasInertiaY) < 0.5) {
                clearInterval(canvasInertiaInterval);
                canvasInertiaInterval = null;
              }
            }, 16);
          }
        }
      };

      window.addEventListener('mouseup', endCanvasDrag);

      // Canvas zoom with wheel
      workspace.addEventListener('wheel', function(e) {
        e.preventDefault();
        var rect = workspace.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var prevZoom = canvasZoom;
        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        canvasZoom = Math.max(0.2, Math.min(5, canvasZoom * delta));
        var scale = canvasZoom / prevZoom;
        canvasPanX = mx - (mx - canvasPanX) * scale;
        canvasPanY = my - (my - canvasPanY) * scale;
        updateCanvasZoomLabel();
        renderCanvas();
      }, { passive: false });

      // Canvas touch support
      var touchStartDist = 0;
      var touchStartZoom = 1;
      var touchStartPanX = 0;
      var touchStartPanY = 0;
      var touchCount = 0;

      workspace.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
          touchCount = 1;
          var item = e.target.closest('.canvas-item');
          if (item) {
            canvasDragItem = item.dataset.id;
            var ci = state.canvasItems.find(function(i) { return i.id === canvasDragItem; });
            if (ci) {
              canvasDragItemStartX = ci.x;
              canvasDragItemStartY = ci.y;
              canvasDragMouseStartX = e.touches[0].clientX;
              canvasDragMouseStartY = e.touches[0].clientY;
            }
            return;
          }
          canvasIsPanning = true;
          canvasPanStartX = e.touches[0].clientX;
          canvasPanStartY = e.touches[0].clientY;
          canvasPanStartOffsetX = canvasPanX;
          canvasPanStartOffsetY = canvasPanY;
        } else if (e.touches.length === 2) {
          touchCount = 2;
          touchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          touchStartZoom = canvasZoom;
          touchStartPanX = canvasPanX;
          touchStartPanY = canvasPanY;
        }
      }, { passive: true });

      workspace.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (touchCount === 1 && canvasDragItem) {
          var dx = (e.touches[0].clientX - canvasDragMouseStartX) / canvasZoom;
          var dy = (e.touches[0].clientY - canvasDragMouseStartY) / canvasZoom;
          var ci = state.canvasItems.find(function(i) { return i.id === canvasDragItem; });
          if (ci) {
            ci.x = Math.round((canvasDragItemStartX + dx) / canvasSnapGrid) * canvasSnapGrid;
            ci.y = Math.round((canvasDragItemStartY + dy) / canvasSnapGrid) * canvasSnapGrid;
            renderCanvas();
          }
          return;
        }
        if (touchCount === 1 && canvasIsPanning) {
          canvasPanX = canvasPanStartOffsetX + (e.touches[0].clientX - canvasPanStartX);
          canvasPanY = canvasPanStartOffsetY + (e.touches[0].clientY - canvasPanStartY);
          renderCanvas();
        } else if (touchCount === 2 && e.touches.length === 2) {
          var dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          var scale = dist / touchStartDist;
          canvasZoom = Math.max(0.2, Math.min(5, touchStartZoom * scale));
          updateCanvasZoomLabel();
          renderCanvas();
        }
      }, { passive: false });

      workspace.addEventListener('touchend', function() {
        touchCount = 0;
        if (canvasDragItem) { _persistState(); canvasDragItem = null; }
        canvasIsPanning = false;
      });
    }

    // Canvas item deletion
    document.getElementById('canvasArea')?.addEventListener('click', function(e) {
      var delBtn = e.target.closest('.canvas-item-delete');
      if (delBtn) {
        e.stopPropagation();
        deleteCanvasItem(delBtn.dataset.id);
      }
    });

    // Export modal
    var noteExportBtn = document.getElementById('noteExportBtn');
    if (noteExportBtn) noteExportBtn.addEventListener('click', openExportModal);

    var projSearchBtn = document.getElementById('projectSearchBtn');
    if (projSearchBtn) {
      projSearchBtn.addEventListener('click', function() {
        var input = document.getElementById('projectSearchInput');
        if (input) input.focus();
      });
    }

    var exportModalClose = document.getElementById('exportModalClose');
    if (exportModalClose) exportModalClose.addEventListener('click', closeExportModal);

    var exportCancel = document.getElementById('exportCancel');
    if (exportCancel) exportCancel.addEventListener('click', closeExportModal);

    var exportConfirm = document.getElementById('exportConfirm');
    if (exportConfirm) exportConfirm.addEventListener('click', function() {
      var activeOption = document.querySelector('.export-option.active');
      exportToPDF(activeOption ? activeOption.dataset.export : 'project');
    });

    var exportModal = document.getElementById('exportModal');
    if (exportModal) {
      exportModal.addEventListener('click', function(e) {
        if (e.target === e.currentTarget) closeExportModal();
      });
    }

    var exportOptions = document.querySelectorAll('.export-option');
    exportOptions.forEach(function(btn) {
      btn.addEventListener('click', function() {
        exportOptions.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  }

  // ============================
  // BOOT STRATEGY
  // ============================
  // We need to call initPhase2 once at startup.
  // Strategy: override init so that when app.js calls it (via DOMContentLoaded or direct call),
  // it runs both origInit and initPhase2.
  // But we must avoid double-calling if app.js already ran init before we loaded.

  var alreadyBooted = false;

  function bootPhase2() {
    if (alreadyBooted) return;
    alreadyBooted = true;
    // CRITICAL: Reload state using the overridden loadState (which reads arc_projects, arc_notes, arc_canvas).
    // Without this, projects/notes/canvas are never loaded from localStorage when scripts run at end of <body>
    // (because app.js calls init() — and the original loadState — before phase2.js overrides it).
    arc.loadState();
    initPhase2();
    renderProjects();
    renderNotesList();
    renderNoteEditor();
    renderCanvas();
    var vEl = document.getElementById('appVersionValue');
    if (vEl) vEl.textContent = '3.0.0';
  }

  var origInit = arc._origInit;
  arc.setInit(function() {
    origInit();
    bootPhase2();
  });

  // Override navigateTo
  var origNavigateTo = arc._origNavigateTo;
  arc.setNavigateTo(function(section) {
    origNavigateTo(section);
    if (section === 'proyectos') renderProjects();
    if (section === 'notas') { renderNotesList(); renderNoteEditor(); }
    if (section === 'canvas') renderCanvas();
  });

  // If document is already loaded, app.js already called init() (original) before we overrode it.
  // We need to call bootPhase2 directly to run our code.
  if (document.readyState !== 'loading') {
    setTimeout(bootPhase2, 0);
  }
  // If document is still loading, the DOMContentLoaded handler from app.js already references
  // `init` (which we just overrode), so it will call origInit + bootPhase2 automatically.
})();
