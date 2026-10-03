const fs = require('fs');
let s = fs.readFileSync('src/components/Settings.tsx', 'utf8');
// The section must have been inserted but the Danger Zone anchor might be missing
// Let's check what anchor we searched for
console.log('Has Danger Zone anchor:', s.includes('{/* Danger Zone */}'));
// Find any occurrence
const idx = s.indexOf('coreSatelliteTarget');
console.log('Context around coreSatelliteTarget:');
console.log(s.slice(Math.max(0, idx-100), idx+200));
