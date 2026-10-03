const fs = require('fs');
let code = fs.readFileSync('src/components/ConfirmModal.tsx', 'utf8');
console.log(code.slice(0, 300));
