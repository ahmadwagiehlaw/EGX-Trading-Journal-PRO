const fs = require('fs');
let sCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const sIdx = sCode.indexOf('handleClearData');
console.log("Settings handleClearData:", sCode.slice(sIdx - 50, sIdx + 150));

let tCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const tIdx = tCode.indexOf('handleSave');
console.log("TxForm handleSave:", tCode.slice(tIdx - 50, tIdx + 150));
