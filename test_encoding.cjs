const iconv = require('iconv-lite');
const fs = require('fs');
let content = fs.readFileSync('src/components/TradesJournal.tsx', 'utf8');
let sample = content.substring(content.indexOf('title='), content.indexOf('title=') + 100);
console.log('Original:', sample);

try {
  let encoded = iconv.encode(sample, 'win1256');
  let decoded = iconv.decode(encoded, 'utf8');
  console.log('Decoded:', decoded);
} catch (e) {
  console.log('Error', e);
}
