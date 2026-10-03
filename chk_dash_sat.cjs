const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('Satellite') || lines[i].includes('satellite')) {
      console.log(`Line ${i}: ${lines[i]}`);
   }
}
