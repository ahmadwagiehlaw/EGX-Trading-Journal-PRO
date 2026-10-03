const fs = require('fs');
let sCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const sIdx = sCode.indexOf('const handle');
console.log(sCode.slice(sIdx, sIdx + 1000));
