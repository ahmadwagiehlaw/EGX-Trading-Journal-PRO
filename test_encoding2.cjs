const iconv = require('iconv-lite');
const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

console.log('Contains سجل:', content.includes('سجل'));
console.log('Contains ط³ط¬ظ„:', content.includes('ط³ط¬ظ„'));

