const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('متوسط سعر الدخول:'));
console.log(lines.slice(start - 15, start + 35).join('\n'));
