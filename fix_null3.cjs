const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Put it back to after hooks
c = c.replace(/}, \[position\]\);\n\n  if \(\!position \|\| \!metrics\) return null;/g, "}, [position]);");

const target = 'const currentHighest = position.trailingStop?.highestReached || metrics.avgEntry;';
c = c.replace(target, 'if (!position || !metrics) return null;\n\n  const currentHighest = position.trailingStop?.highestReached || metrics.avgEntry;');

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
