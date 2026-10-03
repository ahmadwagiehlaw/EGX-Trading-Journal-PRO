const fs = require('fs');
let set = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const label = 'نسبة عمولة الوسيط والرسوم (0.003 = 0.3%)';
const newLabel = 'العمولة الإجمالية والرسوم والضرائب (مثال: 0.005 يعني 0.5% ذهاب وعودة)';

set = set.replace(label, newLabel);
fs.writeFileSync('src/components/Settings.tsx', set, 'utf8');
console.log('✓ Updated Settings');
