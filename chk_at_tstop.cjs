const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const tStopIdx = at.indexOf('timeStopDays');
console.log(tStopIdx);
