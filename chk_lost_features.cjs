const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');
console.log("TradesJournal has Open Lots: ", code.includes('Open Lots') || code.includes('دفعات التمركز'));
let code2 = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
console.log("ActiveTrades has Open Lots: ", code2.includes('Open Lots') || code2.includes('دفعات التمركز'));
