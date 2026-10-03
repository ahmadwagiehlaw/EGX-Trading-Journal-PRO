const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < 60; i++) {
  if (lines[i].includes('activeTab')) {
     console.log(`Line ${i}: ${lines[i]}`);
  }
}
