const fs = require('fs');

// --- ActiveTrades.tsx ---
let aCode = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
aCode = aCode.replace("const { positions, updateTrailingStop, updatePosition } = useTrades();", "const { positions, updateTrailingStop, updatePosition, deleteTransaction } = useTrades();");
fs.writeFileSync('src/components/ActiveTrades.tsx', aCode, 'utf8');

// --- TransactionFormModal.tsx ---
let tCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const tHandle = "  const handleSubmit = async (e: React.FormEvent) => {";
const tExec = `  const executeSaveFromPending = () => {
    if (pendingSavePayload) {
      if (transactionToEdit) {
        updateTransaction(position!.id, transactionToEdit.id, pendingSavePayload.payload);
      } else {
        addTransaction(position!.id, pendingSavePayload.type, pendingSavePayload.payload);
      }
      setConfirmInsufficient(false);
      setPendingSavePayload(null);
      onClose();
    }
  };

`;
if (!tCode.includes('executeSaveFromPending')) {
    tCode = tCode.replace(tHandle, tExec + tHandle);
}
// wait, position!.id or positionId? Let's check variables in TransactionFormModal
// in oldCheck: updateTransaction(positionId... wait, I used position!.id below. I'll just use `position!.id`.

// Also the check string `if (!window.confirm(\`:   ` didn't match.
// Let's find it.
const searchConfirm = "if (!window.confirm(`تحذير: السيولة المتاحة";
const tStart = tCode.indexOf(searchConfirm);
if (tStart > -1) {
    const startIf = tCode.lastIndexOf('if', tStart);
    const endIf = tCode.indexOf('}', tStart) + 1;
    tCode = tCode.slice(0, startIf) + `setPendingSavePayload({ type, payload });\n        setConfirmInsufficient(true);\n        return;` + tCode.slice(endIf);
} else {
    // maybe it has backticks but different formatting? Let's use regex
    const confirmRegex = /if\s*\(\!window\.confirm\([^)]*\)\)\s*\{[^}]*\}/;
    const match = tCode.match(confirmRegex);
    if (match) {
        tCode = tCode.replace(match[0], `setPendingSavePayload({ type, payload });\n        setConfirmInsufficient(true);\n        return;`);
    }
}
fs.writeFileSync('src/components/TransactionFormModal.tsx', tCode, 'utf8');

// --- Settings.tsx ---
let sCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const sHandle = "  const handleClearData = () => {";
const sExec = `  const handleClearData = () => setConfirmReset(true);

  const executeClearData = async () => {
    try {
      await clearAllData();
      alert('تم مسح البيانات وتسجيل الخروج بنجاح.');
    } catch (error: any) {
      alert('حدث خطأ أثناء مسح البيانات: ' + error.message);
    } finally {
      setConfirmReset(false);
    }
  };

// original handleClearData:`;
if (!sCode.includes('executeClearData')) {
    const match = sCode.match(/const handleClearData = \(\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\s*\}\s*\}\s*\};/);
    if (match) {
       // Wait, no, handleClearData in Settings is smaller. Let's just find the function block.
       // actually, it has if(window.confirm) inside.
       const hcRegex = /const handleClearData = \(\) => \{[\s\S]*?\}\s*};\s*/;
       sCode = sCode.replace(hcRegex, sExec);
    } else {
        const hcStart = sCode.indexOf('const handleClearData = () => {');
        const hcEnd = sCode.indexOf('};', hcStart) + 2;
        if (hcStart > -1) sCode = sCode.slice(0, hcStart) + sExec + sCode.slice(hcEnd);
    }
}
fs.writeFileSync('src/components/Settings.tsx', sCode, 'utf8');

console.log("Fixed missing pieces!");
