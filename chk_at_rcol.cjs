const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const rIdx = code.indexOf('{/* Right Column: Live TradingView Chart');
console.log(code.slice(rIdx, rIdx + 1000));
