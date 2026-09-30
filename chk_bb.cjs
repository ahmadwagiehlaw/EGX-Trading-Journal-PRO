const fs = require('fs');
const iconv = require('iconv-lite');
let buf = fs.readFileSync('tmp_orig.tsx');
let str = buf.toString('utf16le');
const lines = str.split('\n');
const idx = lines.findIndex(l => l.includes('Trailing Stop Adjustment Input'));
console.log(lines.slice(idx - 5, idx + 45).join('\n'));
