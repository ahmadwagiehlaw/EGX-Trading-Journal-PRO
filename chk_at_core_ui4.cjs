const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('placeholder="0"');
console.log(code.slice(tIdx, tIdx + 400));
