const fs = require('fs');
let code = fs.readFileSync('src/utils/calculations.ts', 'utf8');
console.log(code.includes('computeOpenLots'));
