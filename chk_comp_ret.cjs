const fs = require('fs');
const calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const compIdx = calc.indexOf('export function computePositionMetrics');
const compEnd = calc.indexOf('return {', compIdx);
console.log(calc.slice(compEnd, compEnd + 500));
