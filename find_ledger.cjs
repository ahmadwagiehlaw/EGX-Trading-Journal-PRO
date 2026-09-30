const fs = require('fs');
const files = fs.readdirSync('src/components');
for (const f of files) {
  if (f.endsWith('.tsx') || f.endsWith('.bak')) {
    const text = fs.readFileSync(`src/components/${f}`, 'utf8');
    if (text.includes('سجل صفقات السهم')) {
      console.log(`Found in: ${f} (${text.length} bytes)`);
    }
  }
}
