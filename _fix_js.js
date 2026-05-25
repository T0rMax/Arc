const fs = require('fs');
let c = fs.readFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/_add_js.js', 'utf8');

c = c.replace(/textConent/g, 'textContent');
c = c.replace(/stateactiveNoteId/g, 'state.activeNoteId');
c = c.replace(/\.atasets/g, '.dataset');
c = c.replace(/formua/g, 'formula');
c = c.replace(/canvasItes/g, 'canvasItems');
c = c.replace(/canvasDagItem/g, 'canvasDragItem');
c = c.replace(/'\)\)/g, '")');

// Fix extra closing parens on event listeners like: .addEventListener('click'), () => {
c = c.replace(/\.addEventListener\('click'\)\s*,\s*\(\)\s*=>\s*\{/g, ".addEventListener('click', function() {");
c = c.replace(/\.addEventListener\('click'\)\s*,\s*\(\)\s*=>\s*createNote\(\)\)/g, ".addEventListener('click', createNote)");

// Fix missing open bracket after 'click', () =>
c = c.replace(/\.addEventListener\('click'\),\s*\(\) =>/g, ".addEventListener('click', function()");

// Fix renderNotesList call
c = c.replace(/renderNotesList\(e\.target\.value\)/g, 'renderNotesList(document.getElementById("notesSearchInput").value)');

// Fix searchTerm reference
c = c.replace(/if \(!searchTerm\)/g, 'if (!st)');

// Fix the deleteCanvasItem typo in the function call
c = c.replace(/deleteCavasItem/g, 'deleteCanvasItem');

// Fix <\/di> typo
c = c.replace(/<\/di>/g, '</div>');

fs.writeFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/_add_js.js', c, 'utf8');
console.log('All typos fixed successfully');
console.log('File size:', c.length, 'chars');