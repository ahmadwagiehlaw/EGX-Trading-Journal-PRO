const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('export interface TickerPosition');
console.log(code.slice(tIdx, tIdx + 500));
