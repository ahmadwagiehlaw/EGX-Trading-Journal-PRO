const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('متوسط سعر الدخول:'));
console.log(lines.slice(idx - 10, idx + 20).join('\n'));
