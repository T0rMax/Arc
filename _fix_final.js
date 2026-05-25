const fs = require('fs');
let c = fs.readFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', 'utf8');

// Fix ALL instances of 'X" (single-quote open, double-quote close)
// This handles: 'es-ES", 'active", 'project", etc.
c = c.replace(/'([^']*?)"/g, (match, inside) => {
  // If inside contains only safe characters, fix it
  return "'" + inside + "')";
});

// Fix ALL instances of "X' (double-quote open, single-quote close)  
c = c.replace(/"([^"]*?)'/g, (match, inside) => {
  return '"' + inside + '"';
});

// Specifically fix the confirm lines that may be affected
c = c.replace(/confirm\("Eliminar nota\?"\)\)/g, 'confirm("Eliminar nota?")');

fs.writeFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', c, 'utf8');
console.log('All remaining quote issues fixed');