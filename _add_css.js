const fs = require('fs');
const cssPath = 'C:/Users/mxsys/OneDrive/Documentos/program/arc/css/style.css';

let css = fs.readFileSync(cssPath, 'utf8');

const newStyles = `

/* =============================================
   PHASE 2 — PROJECTS, NOTES, CANVAS, EXPORT
   ============================================= */

/* --- PROJECTS --- */
.projects-container {
  padding: 0 28px 28px;
  max-width: 1000px;
  margin: 0 auto;
}

.projects-toolbar {
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.projects-search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.projects-search-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.proj-search-icon { opacity: 0.4; flex-shrink: 0; }

.projects-search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 14px;
  font-weight: 400;
  outline: none;
}

.projects-search-input::placeholder { color: var(--text-tertiary); }

.projects-filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.proj-filter-chip {
  padding: 6px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  color: var(--text-secondary);
  font-family: var(--font);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-spring);
}

.proj-filter-chip:hover {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
}

.proj-filter-chip.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent-light);
}

.projects-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  color: var(--text-tertiary);
  gap: 16px;
  text-align: center;
}

.projects-empty p { font-size: 15px; font-weight: 500; }

.projects-empty-btn {
  padding: 10px 22px;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-spring);
  box-shadow: 0 4px 12px var(--accent-glow);
}

.projects-empty-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--accent-glow-strong);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  padding: 20px;
  background: var(--bg-glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  background: var(--bg-card);
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
}

.project-card-pin {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 22px;
  height: 22px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: var(--transition);
}

.project-card-pin.pinned {
  color: var(--accent-light);
}

.project-card-color {
  width: 100%;
  height: 3px;
  border-radius: 3px;
  margin-bottom: 14px;
}

.project-card-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.project-card-category {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.project-card-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.project-card-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.project-card-actions {
  display: flex;
  gap: 4px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--glass-border);
  opacity: 0;
  transition: var(--transition);
}

.project-card:hover .project-card-actions { opacity: 1; }

.project-card-action {
  padding: 4px 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  color: var(--text-tertiary);
  font-family: var(--font);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.project-card-action:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text-primary);
}

.project-card-action.danger:hover {
  color: var(--danger);
  border-color: var(--danger-glow);
}

/* --- NOTES --- */
.notes-container {
  padding: 0 28px 28px;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  gap: 16px;
  height: calc(100vh - 100px);
}

.notes-sidebar {
  width: 260px;
  flex-shrink: 0;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.notes-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.notes-search-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.note-srch-icon { opacity: 0.4; flex-shrink: 0; }

.notes-search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 13px;
  outline: none;
}

.notes-search-input::placeholder { color: var(--text-tertiary); }

.notes-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.notes-empty-list {
  padding: 24px 0;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

.note-list-item {
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: var(--transition);
  border: 1px solid transparent;
}

.note-list-item:hover {
  background: rgba(255,255,255,0.04);
  border-color: var(--glass-border);
}

.note-list-item.active {
  background: var(--accent-glow);
  border-color: var(--accent);
}

.note-list-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-list-item-preview {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-list-item-date {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.notes-editor-panel {
  flex: 1;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-width: 0;
}

.notes-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-tertiary);
}

.notes-editor-empty p { font-size: 15px; font-weight: 500; }

.notes-editor-active {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-title-input {
  width: 100%;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--glass-border);
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 22px;
  font-weight: 700;
  outline: none;
  transition: var(--transition);
}

.note-title-input:focus {
  border-color: var(--accent);
}

.note-title-input::placeholder { color: var(--text-tertiary); }

.note-meta-bar {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.note-content-area {
  flex: 1;
  padding: 14px 0;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 15px;
  line-height: 1.7;
  outline: none;
  resize: none;
  min-height: 200px;
}

.note-content-area::placeholder { color: var(--text-tertiary); }

.note-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--glass-border);
}

.note-action-btn {
  padding: 8px 18px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.note-action-btn:hover {
  background: rgba(255,255,255,0.1);
  color: var(--text-primary);
}

.note-action-btn.primary {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  color: #fff;
  border-color: var(--accent);
}

.note-action-btn.primary:hover {
  box-shadow: 0 4px 16px var(--accent-glow);
}

.note-action-btn.danger:hover {
  color: var(--danger);
  border-color: var(--danger-glow);
}

/* --- CANVAS --- */
.canvas-container {
  padding: 0 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 80px);
}

.canvas-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  flex-shrink: 0;
  align-self: flex-start;
}

.canvas-tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  color: var(--text-tertiary);
  font-family: var(--font);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.canvas-tool-btn:hover {
  background: rgba(255,255,255,0.06);
  color: var(--text-secondary);
  border-color: var(--glass-border);
}

.canvas-tool-btn.active {
  background: var(--accent-glow);
  color: var(--accent-light);
  border-color: var(--accent);
}

.canvas-workspace {
  flex: 1;
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  min-height: 300px;
}

.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-tertiary);
}

.canvas-empty p { font-size: 14px; font-weight: 500; }

.canvas-area {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.canvas-zoom-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* Canvas items */
.canvas-item {
  position: absolute;
  padding: 14px 18px;
  background: var(--bg-glass);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  box-shadow: var(--glass-shadow);
  cursor: grab;
  min-width: 160px;
  max-width: 280px;
  transition: box-shadow 0.2s ease;
  user-select: none;
  z-index: 1;
}

.canvas-item:hover {
  border-color: var(--glass-border-hover);
  box-shadow: 0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--accent-glow);
}

.canvas-item.dragging {
  cursor: grabbing;
  z-index: 100;
  box-shadow: 0 16px 64px rgba(0,0,0,0.6), 0 0 0 1px var(--accent);
  transform: scale(1.02);
}

.canvas-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.canvas-item-content {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.canvas-item-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 50%;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition);
}

.canvas-item:hover .canas-item-delete {
  opacity: 1;
}

.canvas-item-delete:hover {
  background: var(--danger-glow);
  color: var(--danger);
}

/* --- EXPORT MODAL --- */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.export-option {
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.export-optio:hover {
  background: rgba(255,255,255,0.06);
  color: var(--text-primary);
}

.export-option.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent-light);
}

/* --- RESPONSIVE: PROJECTS --- */
@media (max-width: 767px) {
  .projects-container { padding: 0 16px 20px; }
  .projects-toolbar { padding: 12px 16px; }
  .projects-grid { grid-template-columns: 1fr; gap: 12px; }
  .project-card { padding: 16px; }
  .project-card-actions { opacity: 1; }
  .projects-filter-chips { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
  .proj-filter-chip { flex-shrink: 0; }
}

/* --- RESPONSIVE: NOTES --- */
@media (max-width: 767px) {
  .notes-container {
    padding: 0 16px 20px;
    flex-direction: column;
    height: auto;
    gap: 12px;
  }
  .notes-sidebar {
    width: 100%;
    max-height: 200px;
  }
  .notes-editor-panel { min-height: 300px; }
  .note-title-input { font-size: 18px; }
  .note-content-area { font-size: 14px; min-height: 150px; }
  .note-actions { flex-wrap: wrap; }
  .note-meta-bar { flex-direction: column; gap: 4px; }
}

/* --- RESPONSIVE: CANVAS --- */
@media (max-width: 767px) {
  .canvas-container {
    padding: 0 16px 20px;
    height: calc(100vh - 120px);
  }
  .canvas-toolbar { align-self: stretch; flex-wrap: wrap; justify-content: center; }
  .canvas-tool-btn { padding: 6px 10px; font-size: 11px; }
}

/* --- PRINT STYLES FOR PDF --- */
@medi print {
  .sidebar, .bottom-nav, .install-btn, .ambient-bg, .offline-indicator,
  .menu-btn, .header-icon-btn, .canvas-toolbar, .note-actions,
  .projects-toolbar, .modal-overlay, #cmdPalette, #installModal,
  .formula-item-actions, .history-item-copy, .result-copy-btn,
  .formula-calc-copy, .formula-calc-eval-btn, .formula-calc-clear,
  .add-formula-btn, .sci-key, .dash-action, .graph-overlay-controls,
  .graph-submit, .graph-presets, .project-card-actions, .project-card-action {
    display: none !important;
  }

  body { background: #fff; color: #000; overflow: visible; }
  #app { display: block; height: auto; width: 100%; overflow: visible; }
  .content { height: auto; overflow: visible; padding: 0 !important; }
  .section { display: block !important; animation: none !important; }
  .section.active { animation: none !important; }
  .section-header { position: static; background: none; padding: 20px 0; }
  .glass { background: none; backdrop-filter: none; border: none; box-shadow: none; }
  .calc-hero::before, .calc-result-card::before, .formula-calc-panel::before,
  .formula-calc-result-row::before { display: none; }
  .calc-result-display { font-size: 36px; color: #000; }
  .result-value { color: #1a1a1a; }
  .dash-stats { color: #000; }
  .dash-stat-value { color: #1a1a1a; }
  .section-title { color: #000; }
  * { color: #000 !important; text-shadow: none !important; }
  a, button { color: #000 !important; }
  input, textarea, select { border-color: #ccc !important; background: #fff !important; color: #000 !important; }
  .calc-input, .graph-input, .formula-calc-expr-input { background: #fff !important; border: 1px solid #ccc !important; }
  .preset-chip, .rounding-chip, .category-pill { border: 1px solid #ccc !important; background: #fff !important; }
  .preset-chip.active, .rounding-chip.active, .category-pill.active { background: #e0e0e0 !important; border-color: #999 !important; }
  .dash-widgets { grid-template-columns: 1fr 1fr; }
  .projects-grid { grid-template-columns: 1fr 1fr; }
  .project-card { border: 1px solid #ddd !important; background: #fff !important; }
  .note-title-input { border-bottom: 1px solid #ccc !important; }
  .notes-sidebar { border: 1px solid #ddd !important; background: #fff !important; }
  .notes-editor-panel { border: 1px solid #ddd !important; background: #fff !important; }
  .canvas-workspace { border: 1px solid #ddd !important; min-height: 400px; }
  .canvas-area { min-height: 400px; }
  .projects-empty, .notes-editor-empty, .canvas-empty { display: none !important; }
  .dash-recent-item { border: 1px solid #eee !important; }
  .history-item { border: 1px solid #eee !important; }
  .formula-item { border: 1px solid #eee !important; }
  .formula-grid { border: none !important; }
  .graph-canvas-wrap { border: 1px solid #ddd !important; aspect-ratio: auto; min-height: 300px; }
  #graphCanvas { filter: none; }
  .sci-display { border: 1px solid #ddd !important; }
  .sci-body { border: 1px solid #ddd !important; }
  .sci-key { border: 1px solid #ccc !important; background: #f5f5f5 !important; }
  .sci-key.enter { background: #e0e0e0 !important; color: #000 !important; }
  .settings-group { border: 1px solid #ddd !important; }
  .setting-select { border: 1px solid #ccc !important; }
  
  @page { margin: 20mm; size: A4; }
  .section { page-break-after: always; }
}`;

fs.writeFileSync(cssPath, css + newStyles, 'utf8');
console.log('CSS styles added successfully');