const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

code = code.replace("AlertOctagon, Target } from 'lucide-react'", "AlertOctagon, Target, Edit2 } from 'lucide-react'");
fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Added Edit2 to imports");
