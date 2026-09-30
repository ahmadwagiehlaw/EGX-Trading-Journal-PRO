const fs = require('fs');
const content = fs.readFileSync('src/utils/calculations.ts', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(0, 5).join('\n'));
