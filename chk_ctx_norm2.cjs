const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const tIdx = code.indexOf('function normalizePosition');
console.log(code.slice(tIdx + 1000, tIdx + 2000));
