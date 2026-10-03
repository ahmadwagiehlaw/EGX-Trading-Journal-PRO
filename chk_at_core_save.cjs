const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tIdx = code.indexOf('const handleSaveCoreShares');
console.log(code.slice(tIdx, tIdx + 400));
