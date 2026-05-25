const fs = require('fs');
const path = 'C:/Users/mxsys/OneDrive/Documentos/program/arc/index.html';

let html = fs.readFileSync(path, 'utf8');

const notasSection = `
    <!-- ====== NOTAS ====== -->
    <section id="section-notas" class="section">
      <div class="section-header">
        <div class="header-left">
          <button class="menu-btn" aria-label="Men\u00fa"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor"/></svg></button>
          <h1 class="section-title">Notas</h1>
        </div>
        <div class="header-right">
          <button class="header-icon-btn" id="notesSearchBtn" title="Buscar"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" fill="currentColor"/></svg></button>
          <button class="header-icon-btn" id="notesPinFilter" title="Fijadas"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M16 11c0 1.66-1.34 3-3 3h-2v5h-2v-5H7v-3h2V6c0-1.66 1.34-3 3-3s3 1.34 3 3v5h2v3h-1z" fill="currentColor"/></svg></button>
          <button class="header-icon-btn" id="addNoteBtn" title="Nueva nota"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg></button>
        </div>
      </div>
      <div class="notes-container">
        <div class="notes-sidebar glass">
          <div class="notes-search-box">
            <svg viewBox="0 0 24 24" width="16" height="16" class="note-srch-icon"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" fill="currentColor"/></svg>
            <input type="text" id="notesSearchInput" class="notes-search-input" placeholder="Buscar notas...">
          </div>
          <div class="notes-list" id="notesList"><div class="notes-empty-list">Sin notas</div></div>
        </div>
        <div class="notes-editor-panel glass" id="notesEditor">
          <div class="notes-editor-empty" id="notesEditorEmpty">
            <svg viewBox="0 0 24 24" width="48" height="48" opacity="0.2"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z" fill="currentColor"/></svg>
            <p>Selecciona o crea una nota</p>
          </div>
          <div class="notes-editor-active" id="notesEditorActive" style="display:none">
            <input type="text" id="noteTitle" class="note-title-input" placeholder="T\u00edtulo de la nota...">
            <div class="note-meta-bar">
              <span class="note-meta-project" id="noteMetaProject">Sin proyecto</span>
              <span class="note-meta-date" id="noteMetaDate"></span>
            </div>
            <textarea id="noteContent" class="note-content-area" placeholder="Escribe tu nota aqu\u00ed..."></textarea>
            <div class="note-actions">
              <button class="note-action-btn primary" id="noteSaveBtn">Guardar</button>
              <button class="note-action-btn" id="notePinBtn">Fijar</button>
              <button class="note-action-btn danger" id="noteDeleteBtn">Eliminar</button>
              <button class="note-action-btn" id="noteExportBtn">Exportar</button>
            </div>
          </div>
        </div>
      </div>
    </section>
`;

const canvasSection = `
    <!-- ====== CANVAS ====== -->
    <section id="section-canvas" class="section">
      <div class="section-header">
        <div class="header-left">
          <button class="menu-btn" aria-label="Men\u00fa"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor"/></svg></button>
          <h1 class="section-title">Canvas</h1>
        </div>
        <div class="header-right">
          <button class="header-icon-btn" id="canvasZoomOut" title="Alejar"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 13H5v-2h14v2z" fill="currentColor"/></svg></button>
          <span class="canvas-zoom-label" id="canvasZoomLabel">100%</span>
          <button class="header-icon-btn" id="canvasZoomIn" title="Acercar"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg></button>
          <button class="header-icon-btn" id="canvasReset" title="Restablecer"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5V1L7 6l5 5V7a6 6 0 11-6 6H4a8 8 0 108-8z" fill="currentColor"/></svg></button>
        </div>
      </div>
      <div class="canvas-container">
        <div class="canvas-toolbar glass">
          <button class="canvas-tool-btn" data-tool="note"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z" fill="currentColor"/></svg><span>Nota</span></button>
          <button class="canvas-tool-btn" data-tool="formula"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor"/></svg><span>F\u00f3rmula</span></button>
          <button class="canvas-tool-btn" data-tool="text"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" fill="currentColor"/></svg><span>Texto</span></button>
          <button class="canvas-tool-btn" data-tool="graph"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 3v18h18v-2H5V3H3z" fill="currentColor"/></svg><span>Gr\u00e1fico</span></button>
        </div>
        <div class="canvas-workspace glass" id="canvasWorkspace">
          <div class="canvas-empty" id="canvasEmpty">
            <svg viewBox="0 0 24 24" width="48" height="48" opacity="0.2"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14z" fill="currentColor"/></svg>
            <p>Canvas vac\u00edo. Usa las herramientas para agregar elementos.</p>
          </div>
          <div class="canvas-area" id="canvasArea"></div>
        </div>
      </div>
    </section>
`;

const exportModal = `
    <!-- ====== EXPORT MODAL ====== -->
    <div id="exportModal" class="modal-overlay">
      <div class="modal-content glass">
        <div class="modal-header"><h2 class="modal-title">Exportar</h2><button class="modal-close" id="exportModalClose">&times;</button></div>
        <div class="modal-body">
          <div class="modal-field">
            <label class="input-label">Tipo de exportaci\u00f3n</label>
            <div class="export-options" id="exportOptions">
              <button class="export-option active" data-export="project">Proyecto completo</button>
              <button class="export-option" data-export="notes">Solo notas</button>
              <button class="export-option" data-export="formulas">Solo f\u00f3rmulas</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" id="exportCancel">Cancelar</button>
          <button class="modal-btn save" id="exportConfirm">Exportar PDF</button>
        </div>
      </div>
    </div>
`;

// Insert sections before </main>
const mainEnd = '</main>';
const idx = html.lastIndexOf(mainEnd);

if (idx !== -1) {
  const insertion = notasSection + canvasSection + exportModal + '\n  ';
  html = html.slice(0, idx) + insertion + html.slice(idx);
  fs.writeFileSync(path, html, 'utf8');
  console.log('Sections added successfully');
  console.log('New file size:', html.length, 'chars');
  console.log('Contains Notas section:', html.includes('section-notas'));
  console.log('Contains Canvas section:', html.includes('section-canvas'));
  console.log('Contains Export modal:', html.includes('exportModal'));
} else {
  console.log('ERROR: </main> not found!');
}