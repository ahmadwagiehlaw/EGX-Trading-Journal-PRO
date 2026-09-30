const fs = require('fs');
const content = fs.readFileSync('src/utils/calculations.ts', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('export function computePositionMetrics'));
console.log(lines.slice(idx, idx + 40).join('\n'));
