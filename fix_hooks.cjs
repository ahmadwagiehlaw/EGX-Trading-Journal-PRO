const fs = require('fs');

// --- ActiveTrades.tsx ---
let activeTradesCode = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
if (!activeTradesCode.includes('const [confirmTxId')) {
    activeTradesCode = activeTradesCode.replace(
        "export default function ActiveTrades() {",
        "export default function ActiveTrades() {\n  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);"
    );
    fs.writeFileSync('src/components/ActiveTrades.tsx', activeTradesCode, 'utf8');
}

// --- Settings.tsx ---
let settingsCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
if (!settingsCode.includes('const [confirmReset')) {
    settingsCode = settingsCode.replace(
        "export default memo(function Settings() {",
        "export default memo(function Settings() {\n  const [confirmReset, setConfirmReset] = useState(false);"
    );
    // Wait, let's just replace the first '{' after 'function Settings'
    const match = settingsCode.match(/function Settings\s*\([^)]*\)\s*\{/);
    if (match) {
        settingsCode = settingsCode.replace(match[0], match[0] + "\n  const [confirmReset, setConfirmReset] = useState(false);");
    }
    fs.writeFileSync('src/components/Settings.tsx', settingsCode, 'utf8');
}

// --- TransactionFormModal.tsx ---
let txCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
if (!txCode.includes('const [confirmInsufficient')) {
    const match = txCode.match(/function TransactionFormModal\s*\([^)]*\)\s*\{/);
    if (match) {
        txCode = txCode.replace(match[0], match[0] + "\n  const [confirmInsufficient, setConfirmInsufficient] = useState(false);\n  const [pendingSavePayload, setPendingSavePayload] = useState<any>(null);");
    }
    fs.writeFileSync('src/components/TransactionFormModal.tsx', txCode, 'utf8');
}

console.log("Hooks injected correctly");
