const fs = require('fs');
const calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');
const lines = calc.split('\n');
const idx = lines.findIndex(l => l.includes('coreAllocation'));
console.log(`Line ${idx+1}: ${lines[idx]}`);
