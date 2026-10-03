const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tIdx = code.indexOf('const [activeTab');
console.log(code.slice(tIdx, tIdx + 400));
