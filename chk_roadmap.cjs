const fs = require('fs');
let roadmap = fs.readFileSync('EGX_Pro_Master_Roadmap.md', 'utf8');
console.log(roadmap.substring(0, 1500));
