const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(100, 115).join('\n'));
console.log('-----');
console.log(lines.slice(540, 555).join('\n'));
