const fs = require('fs');
let tCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const lines = tCode.split('\n');
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('handleSave')) {
        console.log(`Line ${i}: ${lines[i]}`);
    }
}
