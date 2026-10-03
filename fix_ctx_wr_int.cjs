const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const targetStr = "tradesCount: number;";
const newStr = "tradesCount: number;\n  openedCount?: number;\n  closedCount?: number;";

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
    console.log("Added openedCount to WeeklyReview interface");
}
