const fs = require('fs');
let code = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const tIdx = code.indexOf('export interface TickerPosition');
console.log(code.slice(tIdx, tIdx + 1000));
