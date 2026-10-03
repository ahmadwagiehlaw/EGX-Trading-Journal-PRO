const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const hdrEnd = code.indexOf('          {/* Position Metrics Grid */}');
console.log(code.slice(hdrEnd - 500, hdrEnd + 500));
