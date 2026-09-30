const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
if (content.includes('25%')) {
  console.log('Yes!');
}
