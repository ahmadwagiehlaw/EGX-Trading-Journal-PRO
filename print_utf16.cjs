const fs = require('fs');
let buf = fs.readFileSync('ActiveTrades.tsx.bak');
let str = buf.toString('utf16le');
let lines = str.split('\n');
console.log(lines.slice(390, 400).join('\n'));
