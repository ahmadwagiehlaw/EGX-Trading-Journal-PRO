const fs = require('fs');
let txCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
console.log(txCode.includes('ConfirmModal'));
console.log(txCode.includes('pendingSaveData'));
console.log(txCode.indexOf('</form>'));
