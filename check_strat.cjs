const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const stratLabelIdx = code.indexOf('الاستراتيجية / سبب الدخول');
if (stratLabelIdx !== -1) {
    const divStart = code.lastIndexOf('<div>', stratLabelIdx);
    const divEnd = code.indexOf('</div>', stratLabelIdx) + 6;
    
    console.log('Found block from', divStart, 'to', divEnd);
} else {
    console.log('Not found');
}
