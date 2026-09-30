const fs = require('fs');
const content = fs.readFileSync('original_calc.ts', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(0, 10).join('\n'));
