const fs = require('fs');
const iconv = require('iconv-lite');
let buf = fs.readFileSync('tmp_at.tsx');
let str = buf.toString('utf16le');
const lines = str.split('\n');
const start = lines.findIndex(l => l.includes('Trailing Stop Adjustment Input'));
const end = lines.findIndex(l => l.includes('Chart / Ledger toggle'));
console.log(lines.slice(start + 50, end).join('\n'));
