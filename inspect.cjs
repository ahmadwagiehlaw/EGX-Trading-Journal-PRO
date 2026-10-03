const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');
const lines = wl.split('\n');

let start = -1;
let end = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{/* Checklist */}')) {
        start = i;
    }
    if (start > -1 && i > start && lines[i].includes('استراتيجية مخصصة (Custom)') && lines[i].includes('selectedPlan.strategy')) {
        end = i + 10; // rough estimate
        break;
    }
}
console.log("Start line:", start);
console.log("End approx line:", end);
if (start > -1) {
    console.log(lines.slice(start, start + 30).join('\n'));
}

const cStart = wl.indexOf('const calculateScore = (plan: Plan) => {');
console.log("calc start:", cStart);
if (cStart > -1) {
    console.log(wl.slice(cStart, cStart + 300));
}
