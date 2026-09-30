const fs = require('fs');
const content = fs.readFileSync('ActiveTrades.tsx.bak', 'utf8');
if (content.includes('viewMode')) {
  console.log('viewMode found!');
}
if (content.includes('Floating')) {
  console.log('Floating found!');
}
if (content.includes('Market Price')) {
  console.log('Market Price found!');
}
