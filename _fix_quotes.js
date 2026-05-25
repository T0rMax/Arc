const fs = require('fs');
const c = fs.readFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', 'utf8');

// Fix all mixed quote strings in the Phase 2 section
let result = c;

// Fix: confirm('Eliminar proyecto? Esta accion no se puede deshacer."
result = result.replace(
  "confirm('Eliminar proyecto? Esta accion no se puede deshacer.\")",
  'confirm("Eliminar proyecto? Esta accion no se puede deshacer.")'
);

// Fix other potential issues
// Check for lines with mixed single/double quotes
const lines = result.split('\n');
const issues = [];
lines.forEach((line, i) => {
  // Count open single-quote and close double-quote on same line
  const singleOpen = (line.match(/'/g) || []).length;
  const doubleOpen = (line.match(/"/g) || []).length;
  // Simple check: if odd number of either, mark as issue
  if (singleOpen % 2 !== 0 && doubleOpen % 2 !== 0) {
    issues.push((i+1) + ': ' + line.substring(0, 100));
  }
});

fs.writeFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', result, 'utf8');
console.log('Fixed JS file');
if (issues.length > 0) {
  console.log('Potential quote issues remaining:');
  issues.forEach(issue => console.log('  ' + issue));
} else {
  console.log('No obvious quote issues');
}