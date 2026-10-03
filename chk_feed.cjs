const fs = require('fs');
let code = fs.readFileSync('src/components/PlanUpdatesFeed.tsx', 'utf8');
console.log(code.slice(0, 1500));
