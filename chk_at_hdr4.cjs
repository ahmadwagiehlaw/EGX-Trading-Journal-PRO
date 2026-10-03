const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('{/* Trailing Stop Engine */}');
console.log(code.slice(tIdx - 1000, tIdx));
