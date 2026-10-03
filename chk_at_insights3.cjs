const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const rIdx = code.indexOf('insights.length > 0');
console.log(code.slice(rIdx - 500, rIdx + 200));
