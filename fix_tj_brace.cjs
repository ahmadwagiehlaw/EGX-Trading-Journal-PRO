const fs = require('fs');
let code = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');

const badClick = "onClick={() => if (isExpanded) { setExpandedPositionId(null); onCloseActiveTrade?.(); } else { setExpandedPositionId(pos.id); }}";
const goodClick = "onClick={() => { if (isExpanded) { setExpandedPositionId(null); onCloseActiveTrade?.(); } else { setExpandedPositionId(pos.id); } }}";
code = code.replace(badClick, goodClick);

fs.writeFileSync('src/components/TradesJournal.tsx', code, 'utf8');
console.log("Fixed brace error");
