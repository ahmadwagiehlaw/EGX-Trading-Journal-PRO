const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/\n\n            \n\{\/\* Quick Partial Transactions Row \*\/\}/g, "\n          </div>\n\n          {/* Quick Partial Transactions Row */}");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
