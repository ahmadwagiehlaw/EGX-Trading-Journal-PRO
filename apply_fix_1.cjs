const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

const criteriaStr = `const CONFLUENCE_CRITERIA = [
  { id: 'market_trend', label: 'السوق في اتجاه عام صاعد (Uptrend)', points: 1 },
  { id: 'sector_trend', label: 'قطاع السهم إيجابي وتدخله سيولة', points: 1 },
  { id: 'above_ma', label: 'السهم يتداول فوق المتوسطات المهمة (20/50)', points: 1 },
  { id: 'clear_setup', label: 'نموذج فني واضح (اختراق قوي أو ارتداد من دعم)', points: 2 },
  { id: 'volume_confirm', label: 'تأكيد بأحجام التداول (سيولة شرائية أو جفاف بيعي)', points: 2 },
  { id: 'catalyst', label: 'وجود محفز (أخبار جوهرية إيجابية أو أرباح ممتازة)', points: 1 },
  { id: 'rrr_ok', label: 'العائد للمخاطرة (R:R) جذاب وأكبر من 1:2', points: 2 },
];`;

wl = wl.replace("const PLAYBOOK_TEMPLATES = [", criteriaStr + "\n\nconst PLAYBOOK_TEMPLATES = [");

// Empty old checklists
wl = wl.replace(/checklist: \[\s*[^\]]*\s*\]/g, 'checklist: []');

// 2. Update calculateScore
const oldCalc = `const calculateScore = (plan: Plan) => {
    if (!plan.checklist) return 0;
    const items = Object.values(plan.checklist);
    if (items.length === 0) return 0;
    const passed = items.filter(Boolean).length;
    return Math.round((passed / items.length) * 100);
  };`;

const newCalc = `const calculateScore = (plan: Plan) => {
    if (!plan.checklist) return 0;
    let score = 0;
    CONFLUENCE_CRITERIA.forEach(crit => {
      if (plan.checklist?.[crit.id]) {
        score += crit.points;
      }
    });
    return score; // Max 10
  };`;

wl = wl.replace(oldCalc, newCalc);

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('Fixed criteria');
