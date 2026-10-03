const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const startIdx = code.indexOf('Global Portfolio Filter Toggle');
console.log(code.slice(startIdx, startIdx + 1500));
