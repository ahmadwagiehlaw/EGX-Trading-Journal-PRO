const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('interface TickerPosition'));
console.log(lines.slice(idx + 20, idx + 40).join('\n'));
