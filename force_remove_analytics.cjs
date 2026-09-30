const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');
const lines = c.split('\n');
lines.splice(35, 1);
fs.writeFileSync('src/components/Analytics.tsx', lines.join('\n'), 'utf8');
console.log('Removed line 36');
