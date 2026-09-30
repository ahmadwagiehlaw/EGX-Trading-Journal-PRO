const fs = require('fs');
// Wait tmp_at.tsx is utf16le? git show creates utf16. Let's read it correctly.
const iconv = require('iconv-lite');
let buf = fs.readFileSync('tmp_at.tsx');
let str = buf.toString('utf16le');
// wait I don't need Arabic just the structure
const lines = str.split('\n');
const start = lines.findIndex(l => l.includes('Trailing Stop Adjustment Input'));
console.log(lines.slice(start - 5, start + 35).join('\n'));
