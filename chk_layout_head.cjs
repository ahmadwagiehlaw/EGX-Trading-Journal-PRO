const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');
const lines = c.split('\n');
console.log(lines.slice(0, 5).join('\n'));
