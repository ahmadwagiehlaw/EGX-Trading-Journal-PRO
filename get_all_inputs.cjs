const fs = require('fs');
const path = require('path');
function searchInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchInDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        if (l.includes('<input')) {
          console.log(`${fullPath}:${i}: ${l.trim()}`);
        }
      });
    }
  }
}
searchInDir('src');
