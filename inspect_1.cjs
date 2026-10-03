const fs = require('fs');
const calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');
const lines = calc.split('\n');
const idx = lines.findIndex(l => l.includes('interface TickerPosition'));
console.log('=== TickerPosition interface ===');
console.log(lines.slice(idx, idx + 70).join('\n'));
