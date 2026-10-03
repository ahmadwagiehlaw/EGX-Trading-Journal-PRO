const fs = require('fs');
const calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const simIdx = calc.indexOf('export function simulatePositionMetrics');
const endIdx = calc.indexOf('return {', simIdx);
console.log(calc.slice(endIdx, endIdx + 500));
