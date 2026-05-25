const fs = require('fs');
let c = fs.readFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', 'utf8');

// Replace 'string" sequences with 'string'
let count = 0;
c = c.replace(/'([^']*?)"/g, function(match, inner) {
  count++;
  return "'" + inner + "'";
});
console.log('Fixed ' + count + ' single-open/double-close quotes');

fs.writeFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', c, 'utf8');
console.log('Written to file. Check syntax...');