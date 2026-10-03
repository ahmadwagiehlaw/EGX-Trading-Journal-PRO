const fs = require('fs');
const code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const returnIdx = code.indexOf('return (');
console.log(code.slice(returnIdx, returnIdx + 1500));
