const fs = require('fs');
const iconv = require('iconv-lite');
let buf = fs.readFileSync('ActiveTrades.tsx.bak');
let str = buf.toString('utf16le');
let recoveredBytes = iconv.encode(str, 'win1252');
let recoveredStr = iconv.decode(recoveredBytes, 'utf8');
fs.writeFileSync('src/components/ActiveTrades.tsx', recoveredStr, 'utf8');
console.log('Restored perfectly using iconv-lite');
