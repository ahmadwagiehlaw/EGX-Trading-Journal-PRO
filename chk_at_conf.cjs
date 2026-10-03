const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
console.log(code.includes('import ConfirmModal'));
