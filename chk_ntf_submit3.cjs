const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

const sIdx = code.indexOf('const handleAddTrade');
if (sIdx > -1) {
    console.log(code.slice(sIdx, sIdx + 500));
} else {
    const s2 = code.indexOf('const handleSubmit');
    if (s2 > -1) {
        console.log(code.slice(s2, s2 + 500));
    }
}
