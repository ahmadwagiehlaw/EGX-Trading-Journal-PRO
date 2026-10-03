const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const cIdx = code.indexOf('<ConfirmModal');
if (cIdx > -1) {
   console.log(code.slice(cIdx, cIdx + 400));
} else {
   console.log("Not used.");
}
