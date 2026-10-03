const fs = require('fs');
let an = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const lines = an.split('\n');
for (let i = 60; i < 75; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
