const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Check what state variables exist to add coreShares state
const lines = at.split('\n');
const stateIdx = lines.findIndex(l => l.includes('const [isEditingStop, setIsEditingStop]'));
console.log(lines.slice(stateIdx, stateIdx + 5).join('\n'));
