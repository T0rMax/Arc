const fs = require('fs');
let c = fs.readFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', 'utf8');

// Fix all mixed-quote issues
c = c.replace("toLocaleDateString('es-ES\"", "toLocaleDateString('es-ES')");
c = c.replace("confirm('Eliminar nota?\")", 'confirm("Eliminar nota?")');
c = c.replace("classList.remove('active\"", "classList.remove('active')");
c = c.replace("exportToPDF('project\"", 'exportToPDF("project")');

// Also fix the original issue
c = c.replace(
  "confirm('Eliminar proyecto? Esta accion no se puede deshacer.\")",
  'confirm("Eliminar proyecto? Esta accion no se puede deshacer.")'
);

fs.writeFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', c, 'utf8');
console.log('All quote issues fixed');