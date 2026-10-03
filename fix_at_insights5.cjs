const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const lines = code.split('\n');
const goodLines = lines.slice(0, 813);
code = goodLines.join('\n') + '\n';

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log('Removed dangling block');
