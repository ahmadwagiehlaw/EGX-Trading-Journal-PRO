const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');
c = c.replace(/import \{ Gamepad2,\s*/, "import { ");
c = c.replace(/LayoutDashboard,/, "Gamepad2, LayoutDashboard,");
fs.writeFileSync('src/components/Layout.tsx', c, 'utf8');
