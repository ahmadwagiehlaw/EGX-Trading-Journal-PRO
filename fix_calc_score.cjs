const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const calcMatch = wl.match(/const calculateScore = \(plan: Plan\) => \{[\s\S]*?return Math.round\(\(passed \/ items\.length\) \* 100\);\s*\};/);

if (calcMatch) {
    wl = wl.replace(calcMatch[0], `const calculateScore = (plan: Plan) => {
    if (!plan.checklist) return 0;
    let score = 0;
    CONFLUENCE_CRITERIA.forEach(crit => {
      if (plan.checklist?.[crit.id]) {
        score += crit.points;
      }
    });
    return score;
  };`);
    fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
    console.log("Fixed calculateScore");
} else {
    console.log("Could not find calculateScore");
}
