const fs = require('fs');
const c = fs.readFileSync('C:/Users/mxsys/OneDrive/Documentos/program/arc/js/app.js', 'utf8');
console.log('Has initPhase2 called console.log:', c.includes("console.log('initPhase2 called'"));
console.log('Has createProject console.log:', c.includes("console.log('addProjectBtn clicked'"));
console.log('Has emptyAddProject console.log:', c.includes("console.log('emptyAddProject clicked'"));
console.log('Has runPhase2Init function:', c.includes('function runPhase2Init'));
console.log('File size:', c.length, 'chars');