const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const tIdx = code.indexOf('export default function Dashboard(');
console.log(code.slice(tIdx, tIdx + 1500));
