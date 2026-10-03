const fs = require('fs');

let settingsCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const stTarget = "const { theme, toggleTheme } = useTheme();";
console.log("Settings contains stTarget:", settingsCode.includes(stTarget));

let txCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const hookTarget = "const [dateStr, setDateStr] = useState<string>(new Date().toISOString().slice(0, 16));";
console.log("TxForm contains hookTarget:", txCode.includes(hookTarget));
