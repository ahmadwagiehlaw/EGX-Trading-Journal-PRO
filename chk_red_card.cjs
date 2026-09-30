const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('الوقف المتحرك الحالي'));
console.log(lines.slice(idx - 5, idx + 15).join('\n'));
