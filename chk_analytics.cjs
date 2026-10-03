const fs = require('fs');
const code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');
console.log(code.slice(0, 800));
