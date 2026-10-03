const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const sIdx = code.indexOf('const insights = useMemo(generateInsights');
console.log("insights declaration:", code.slice(sIdx - 50, sIdx + 150));

const rIdx = code.indexOf('insights.length > 0');
console.log("insights usage:", code.slice(rIdx - 50, rIdx + 150));
