const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = c.split('\n');
console.log(lines.slice(0, 20).join('\n'));
