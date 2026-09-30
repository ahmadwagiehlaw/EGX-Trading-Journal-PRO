const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = c.split('\n');
console.log(lines.slice(70, 95).join('\n'));
