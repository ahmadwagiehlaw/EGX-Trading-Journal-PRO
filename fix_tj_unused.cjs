const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const oldClick = "setExpandedPositionId(isExpanded ? null : pos.id)";
const newClick = `if (isExpanded) { setExpandedPositionId(null); onCloseActiveTrade?.(); } else { setExpandedPositionId(pos.id); }`;
code = code.replace(oldClick, newClick);

fs.writeFileSync('src/components/TradesJournal.tsx', code, 'utf8');
console.log("Fixed unused var");
