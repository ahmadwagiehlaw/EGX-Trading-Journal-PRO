const fs = require('fs');
let buf = fs.readFileSync('tmp_orig.tsx');
let str = buf.toString('utf16le');
const lines = str.split('\n');
const start = lines.findIndex(l => l.includes('avgEntry.toFixed(2)'));
console.log(lines.slice(start - 8, start + 10).join('\n'));
