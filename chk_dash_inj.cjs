const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (code.includes('حان وقت التقييم والمراجعة!')) {
    console.log("Banner is present!");
} else {
    console.log("Banner NOT found.");
    console.log("Looking for injection point:", code.indexOf('{/* Unified Overview Metrics */}'));
}
