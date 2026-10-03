const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const clockIdx = at.indexOf('<Clock');
console.log(clockIdx);
