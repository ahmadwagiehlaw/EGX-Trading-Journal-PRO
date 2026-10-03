const fs = require('fs');
let calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');
let settings = fs.existsSync('src/components/Settings.tsx') ? fs.readFileSync('src/components/Settings.tsx', 'utf8') : '';
console.log('Calculations has commission:', calc.includes('commissionRate: number = 0.003'));
console.log('Settings exists:', settings.length > 0);
