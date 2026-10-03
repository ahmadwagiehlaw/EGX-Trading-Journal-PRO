const fs = require('fs');
const calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const simIdx = calc.indexOf('export function simulatePositionMetrics');
console.log(calc.slice(simIdx, simIdx + 1500));
