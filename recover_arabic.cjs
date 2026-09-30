const fs = require('fs');
let buf = fs.readFileSync('ActiveTrades.tsx.bak');
let str = buf.toString('utf16le');
let recoveredBytes = new Uint8Array(str.length);
for (let i = 0; i < str.length; i++) {
  recoveredBytes[i] = str.charCodeAt(i) & 0xFF;
}
let recoveredStr = new TextDecoder('utf-8').decode(recoveredBytes);
console.log(recoveredStr.slice(0, 100));
if (recoveredStr.includes('تحديث')) {
  console.log('YES! WE RECOVERED THE ARABIC!');
}
