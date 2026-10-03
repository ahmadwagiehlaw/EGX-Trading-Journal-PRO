const fs = require('fs');
let s = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const lines = s.split('\n');
console.log(lines.slice(15, 20).join('\n'));
