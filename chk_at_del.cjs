const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('Trash2 className=');
console.log(code.slice(tIdx - 400, tIdx + 400));
