const fs = require('fs');
const lines = fs.readFileSync('src/components/Settings.tsx', 'utf8').split('\n');
for (let i = lines.length - 30; i < lines.length; i++) {
   console.log(lines[i]);
}
