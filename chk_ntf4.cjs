const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

const sIdx = code.indexOf('const handleSave = async');
if (sIdx > -1) {
    console.log(code.slice(sIdx, sIdx + 1000));
} else {
    // try to find addPosition
    const lines = code.split('\n');
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('addPosition')) {
            console.log(`Line ${i}: ${lines[i]}`);
        }
    }
}
