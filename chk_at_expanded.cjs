const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = at.indexOf('expandedId === position.id &&');
console.log(at.slice(tIdx, tIdx + 1000));
