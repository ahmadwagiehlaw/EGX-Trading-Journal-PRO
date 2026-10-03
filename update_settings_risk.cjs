const fs = require('fs');
let set = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const label = 'نسبة المخاطرة الافتراضية لكل صفقة (%)';
const newLabel = 'أقصى مخاطرة مسموحة لكل صفقة (%) - Global Risk Tolerance';

set = set.replace(label, newLabel);
fs.writeFileSync('src/components/Settings.tsx', set, 'utf8');
console.log('✓ Updated Settings Risk Label');
