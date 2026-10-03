const fs = require('fs');
let code = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

code = code.replace("{selectedPlan.symbol && (\n                      \n                    )}", "");
// Handle possible indentation variations
code = code.replace(/\{selectedPlan\.symbol && \(\s*\)\}/, "");

fs.writeFileSync('src/components/Watchlist.tsx', code, 'utf8');
console.log("Fixed empty JSX block");
