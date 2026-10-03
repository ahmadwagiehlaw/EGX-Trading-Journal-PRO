const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
code = code.replace(/\{\/\* Smart Insights Panel \(AI Advisor\) \*\/\}[\s\S]*?\n\s*\n/g, '');
fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Cleaned up misinjected AI panel.");
