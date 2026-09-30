const fs = require('fs');
const content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const start = content.indexOf('{/* Plan vs Reality Visual Chart */}');
const end = content.indexOf('{/* Trailing Stop Metrics Cards */}');
console.log(content.slice(start, end));
