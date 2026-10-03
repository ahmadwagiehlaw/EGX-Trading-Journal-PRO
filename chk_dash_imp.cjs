const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

console.log(code.slice(0, 500));
