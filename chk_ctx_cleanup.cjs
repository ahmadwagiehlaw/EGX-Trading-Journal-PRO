const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
if(code.includes('unsubWeekly();')) {
    console.log("unsubWeekly(); is present in cleanup");
} else {
    console.log("unsubWeekly(); is missing in cleanup!");
}
