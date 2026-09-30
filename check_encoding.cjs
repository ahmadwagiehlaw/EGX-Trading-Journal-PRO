const fs = require('fs');
let content = fs.readFileSync('ActiveTrades.tsx.bak');
if (content.toString('utf16le').includes('showChart')) {
  console.log('utf16le has showChart');
} else if (content.toString('utf8').includes('showChart')) {
  console.log('utf8 has showChart');
}
