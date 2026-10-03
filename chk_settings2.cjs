const fs = require('fs');
let s = fs.readFileSync('src/components/Settings.tsx', 'utf8');
// Check if the Core & Satellite section was actually inserted
console.log('Has Core & Satellite section:', s.includes('coreSatelliteTarget'));
console.log('Has slider:', s.includes('type="range"'));
