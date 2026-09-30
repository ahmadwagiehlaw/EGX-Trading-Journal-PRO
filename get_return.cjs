const fs = require('fs');
let content = fs.readFileSync('ActiveTrades.tsx.bak', 'utf16le');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('return ('));
console.log(lines.slice(idx, idx + 100).join('\n'));
