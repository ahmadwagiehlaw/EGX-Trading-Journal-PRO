const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const targetStr = "const insights = useMemo(generateInsights, [position, metrics, coreStats]);";
if (code.includes(targetStr)) {
    code = code.replace(targetStr, "const insights = generateInsights();");
    fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
    console.log("Fixed Hook Rule Violation!");
} else {
    console.log("Could not find targetStr");
}
