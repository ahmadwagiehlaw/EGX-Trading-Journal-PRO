const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');
c = c.replace(/import \{ Gamepad2,\s*useState/, "import { useState");
if (!c.includes("Gamepad2 } from 'lucide-react'")) {
  c = c.replace(/import \{ /, "import { Gamepad2, ");
}
fs.writeFileSync('src/components/Layout.tsx', c, 'utf8');
