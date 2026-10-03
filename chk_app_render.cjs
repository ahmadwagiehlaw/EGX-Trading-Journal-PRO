const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tIdx = code.indexOf('activeTab === \'سجل الصفقات\'');
console.log(code.slice(tIdx, tIdx + 300));
