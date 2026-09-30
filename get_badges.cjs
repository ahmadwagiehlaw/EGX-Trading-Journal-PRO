const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('<div className="flex flex-wrap items-center gap-2">'));
const end = lines.findIndex(l => l.includes('{error && isEditingHighestPrice && ('));
console.log(lines.slice(start, end).join('\n'));
