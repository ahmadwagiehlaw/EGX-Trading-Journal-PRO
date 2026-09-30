const fs = require('fs');
const content = fs.readFileSync('src/utils/calculations.ts', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('computePositionMetrics'));
console.log(lines.slice(idx, idx + 20).join('\n'));
