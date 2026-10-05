const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');

function checkAndFix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) checkAndFix(full);
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      
      // Try to reverse the corruption
      try {
        const encoded = iconv.encode(content, 'win1256');
        const decoded = iconv.decode(encoded, 'utf8');
        
        // If the decoded text has common Arabic words AND the original didn't, or the decoded has more
        const decodedAlCount = (decoded.match(/ال/g) || []).length;
        const originalAlCount = (content.match(/ال/g) || []).length;
        
        // Also check if the original text has the mojibake signature 'ط§ظ„' (which is 'ال' corrupted)
        if (content.includes('ط§ظ„') || (decodedAlCount > 10 && originalAlCount < 5)) {
          console.log('Fixing corrupted file:', full);
          fs.writeFileSync(full, decoded, 'utf8');
        }
      } catch (e) {}
    }
  }
}

checkAndFix('src');
console.log('Done scanning.');
