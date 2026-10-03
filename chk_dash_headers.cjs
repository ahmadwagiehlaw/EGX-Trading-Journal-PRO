const fs = require('fs');
const dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const matches = dash.match(/<div className="bg-white.*?p-6/g);
console.log(matches ? matches.length : 0);

const lines = dash.split('\n');
lines.forEach((l, i) => {
    if (l.includes('<h3') || l.includes('text-slate-500')) {
        console.log(`${i+1}: ${l.trim()}`);
    }
});
