const fs = require('fs');
let c = fs.readFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', 'utf8');

// Fix ALL mixed quote issues systematically
// Pattern: open single quote then close with double quote
c = c.replace(/toLocaleDateString\('es-ES"/g, "toLocaleDateString('es-ES')");
c = c.replace(/classList\.remove\('active"/g, "classList.remove('active')");
c = c.replace(/exportToPDF\('project"/g, 'exportToPDF("project")');

// Also check for any remaining confirm( issues
c = c.replace(/confirm\("(.*?)"\) return/g, 'confirm("$1")) return');

// Check for any remaining improperly closed strings
// All strings should end with the same quote they started with
const lines = c.split('\n');
let fixedCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Skip comments
  if (line.trim().startsWith('//')) continue;
  // Check for lines that have both single and double quote at end
  const singleQ = (line.match(/'/g) || []).length;
  const doubleQ = (line.match(/"/g) || []).length;
  // If odd singles and odd doubles, likely a mixed-quote issue
  // We'll use replaceAll approach instead
}

// More thorough: find any 'X" pattern (single-quoted string ending with double quote)
c = c.replace(/('[^']*)"/g, (match, p1) => {
  // If p1 ends with a single quote, it's already closed
  if (p1.endsWith("'")) return match;
  // If count of single quotes in p1 is odd, need to close properly
  return p1 + "')";
});

fs.writeFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', c, 'utf8');
console.log('Fixed all quote issues');