const fs = require('fs');
let content = fs.readFileSync('ActiveTrades.tsx.bak');
let decoded = new TextDecoder('windows-1256').decode(content);
if (decoded.includes('تحديث')) {
  console.log('WINDOWS-1256 has Arabic!');
} else {
  console.log('No Arabic in Windows-1256');
}
