const fs = require('fs');
let content = fs.readFileSync('ActiveTrades.tsx.bak', 'utf16le');
if (content.includes('تحديث')) {
  console.log('UTF16LE has Arabic!');
} else {
  console.log('No Arabic in UTF16LE');
}
