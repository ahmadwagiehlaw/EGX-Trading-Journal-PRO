const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Header / Basic Info'));
console.log(lines.slice(start, start + 30).join('\n'));
