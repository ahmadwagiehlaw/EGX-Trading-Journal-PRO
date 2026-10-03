const fs = require('fs');

let sCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// The original handleClearData has window.confirm. Let's find it.
const sIdx = sCode.indexOf('const handleClearData = () => {');
if (sIdx > -1) {
    const sEnd = sCode.indexOf('  return (', sIdx);
    if (sEnd > -1) {
        const sExec = `const handleClearData = () => setConfirmReset(true);

  const executeClearData = async () => {
    try {
      localStorage.clear(); 
      window.location.reload();
    } catch (error: any) {
      alert('حدث خطأ أثناء مسح البيانات: ' + error.message);
    } finally {
      setConfirmReset(false);
    }
  };

`;
        sCode = sCode.slice(0, sIdx) + sExec + sCode.slice(sEnd);
        fs.writeFileSync('src/components/Settings.tsx', sCode, 'utf8');
        console.log("Fixed Settings.tsx!");
    } else {
        console.log("Could not find '  return (' in Settings.tsx");
    }
} else {
    console.log("Could not find 'const handleClearData = () => {' in Settings.tsx");
}

let tCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const oldBad = "addTransaction(position!.id, pendingSavePayload.type, pendingSavePayload.payload);";
const goodNew = "addTransaction(position!.id, pendingSavePayload.payload);";
if (tCode.includes(oldBad)) {
    tCode = tCode.replace(oldBad, goodNew);
    fs.writeFileSync('src/components/TransactionFormModal.tsx', tCode, 'utf8');
    console.log("Fixed TransactionFormModal args!");
}
