const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

console.log("Has Quick Partial Transactions Row: " + code.includes('Quick Partial Transactions Row'));
console.log("Has overflow-x-auto bg-white: " + code.includes('<div className="overflow-x-auto bg-white'));
console.log("Has ConfirmModal: " + code.includes('<ConfirmModal'));
console.log("Has insights logic: " + code.includes('generateInsights = () => {'));
