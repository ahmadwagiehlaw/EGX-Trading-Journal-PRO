const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');
content = content.replace("    { name: 'الخزينة', icon: Landmark, color: 'text-indigo-600 dark:text-indigo-400', activeBg: 'bg-indigo-600 text-white shadow-indigo-500/20' },", '');
fs.writeFileSync('src/components/Layout.tsx', content, 'utf8');
console.log('Layout updated');

let dContent = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
dContent = dContent.replace("onClick={() => setIsLedgerOpen(true)}", "onClick={() => onNavigate?.('الخزينة')}");
dContent = dContent.replace("سجل السحب والإيداع", "إدارة الخزينة");
fs.writeFileSync('src/components/Dashboard.tsx', dContent, 'utf8');
console.log('Dashboard updated');

