const fs = require('fs');
let buf = fs.readFileSync('tmp_orig.tsx');
let str = buf.toString('utf16le');
const lines = str.split('\n');
const start = lines.findIndex(l => l.includes('متوسط سعر الدخول:'));
console.log(lines.slice(start - 5, start + 10).join('\n'));
