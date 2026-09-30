const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const bStart = content.indexOf('{/* Trailing Stop Adjustment Input */}');
const bEnd = content.indexOf('{/* Quick Partial Transactions Row */}');
console.log(bStart, bEnd);
if (bStart !== -1 && bEnd !== -1) {
    const endSlice = content.lastIndexOf('</div>', bEnd);
    console.log(endSlice);
    // Actually we want to keep the closing div of the left column.
    // Wait, the blue box itself has a closing `</div>\n            )}`.
    // The left column has a closing `</div>` right after it!
}
