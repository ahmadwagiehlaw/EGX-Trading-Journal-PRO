const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const lines = wl.split('\n');
let newLines = [];
let skip = false;

for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('{showPlaybookInfo && (')) {
        skip = true;
    }
    
    if (!skip) {
        newLines.push(lines[i]);
    }
    
    if (skip && lines[i].includes(')}') && lines[i-1].includes('</div>')) {
        skip = false; // end of block
    }
}

fs.writeFileSync('src/components/Watchlist.tsx', newLines.join('\n'), 'utf8');
console.log('Fixed block');
