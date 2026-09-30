const fs = require('fs');
const path = require('path');

function searchInDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchInDir(fullPath, query);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(query)) {
        console.log(`Found "${query}" in:`, fullPath);
      }
    }
  }
}

searchInDir('src', 'تحديث يدوي');
searchInDir('src', 'عائمة');
searchInDir('src', 'أرباح/خسائر عائمة');
searchInDir('src', 'Plan vs Reality');
