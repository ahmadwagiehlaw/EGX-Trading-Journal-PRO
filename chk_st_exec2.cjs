const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const tIdx = code.indexOf('executeClearData');
console.log(code.slice(tIdx - 100, tIdx + 200));
