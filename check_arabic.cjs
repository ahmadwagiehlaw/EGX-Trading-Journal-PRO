const fs = require('fs');
let content = fs.readFileSync('ActiveTrades.tsx.bak', 'utf16le');
if (content.includes('سجل')) {
  console.log('Found سجل');
} else {
  console.log('Not found');
}
