const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

code = code.replace("useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions'>", "useState<'overview' | 'calendar' | 'psychology' | 'playbook' | 'positions' | 'weekly_review'>");

fs.writeFileSync('src/components/Analytics.tsx', code, 'utf8');
console.log("Fixed activeSubTab type");

let wr = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');
wr = wr.replace("import { useTrades, type WeeklyReview }", "import { useTrades }");
fs.writeFileSync('src/components/WeeklyReviewTab.tsx', wr, 'utf8');
console.log("Removed unused import");
