const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const importIdx = at.indexOf("from 'lucide-react'");
const importStr = at.slice(0, importIdx);

if (!importStr.includes('Clock')) {
    at = at.replace("import { ", "import { Clock, ");
    fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
    console.log("Added Clock to imports");
} else {
    console.log("Clock already imported");
}
