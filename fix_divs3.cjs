const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/            \n\{\/\* Quick Partial Transactions Row \*\/\}/, "          </div>\n\n          {/* Quick Partial Transactions Row */}");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
