const fs = require('fs');
const path = require('path');

function searchInDir(dir, query) {
  if (!fs.existsSync(dir)) return;
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

searchInDir('H:\\Documents\\GitHub\\EGX Trading Journal\\src', 'عائمة');
searchInDir('H:\\Documents\\GitHub\\EGX Trading Journal\\src', 'Plan vs Reality');
