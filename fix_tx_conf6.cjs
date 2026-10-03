const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

// Find the end of handleSubmit
const tIdx = code.indexOf('onClose();');
if (tIdx > -1) {
    code = code.slice(0, tIdx) + "setPendingSaveData(null);\n    " + code.slice(tIdx);
    fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
    console.log("Added setPendingSaveData(null)");
}
