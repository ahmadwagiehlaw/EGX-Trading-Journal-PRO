const fs = require('fs');
const content = fs.readFileSync('src/utils/calculations.ts', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const currentPrice ='));
console.log(lines.slice(idx - 2, idx + 2).join('\n'));
