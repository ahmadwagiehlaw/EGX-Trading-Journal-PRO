const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = at.split('\n');

// Find the Plan vs Reality chart anchor
const idx = lines.findIndex(l => l.includes('{/* Plan vs Reality Visual Chart */}'));
console.log('Plan vs Reality at line:', idx+1);
// Show what comes just before it
console.log(lines.slice(idx - 8, idx + 2).join('\n'));
