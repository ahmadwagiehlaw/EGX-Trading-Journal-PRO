const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const tIdx = code.indexOf('const executeClearData');
console.log(code.slice(tIdx - 100, tIdx + 200));
