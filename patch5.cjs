const fs = require('fs');

let sCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
const sRegex = /const handleClearData = \(\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\s*\}\s*\}\s*\};/;
// Wait, no, URL.revokeObjectURL is in handleExportJson.
// The handleClearData function ends with:
//       if (window.confirm('تأكيد نهائي: اضغط موافق لمسح بياناتك للأبد.')) {
//           clearAllData();
//           ...
//       }
//     }
//   };
const sRegex2 = /const handleClearData = \(\) => \{[\s\S]*?window\.location\.reload\(\);\s*\}\s*\}\s*\};/;
let sMatch = sCode.match(sRegex2);
if (!sMatch) {
    const sStart = sCode.indexOf('const handleClearData = () => {');
    const sEnd = sCode.indexOf('  return (', sStart);
    if (sStart > -1 && sEnd > -1) {
        const sNew = `const handleClearData = () => setConfirmReset(true);

  const executeClearData = async () => {
    try {
      localStorage.clear(); // fallback
      window.location.reload();
    } catch (error: any) {
      alert('حدث خطأ أثناء مسح البيانات: ' + error.message);
    } finally {
      setConfirmReset(false);
    }
  };

`;
        sCode = sCode.slice(0, sStart) + sNew + sCode.slice(sEnd);
    }
}
fs.writeFileSync('src/components/Settings.tsx', sCode, 'utf8');

let tCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
const tStart = tCode.indexOf('const handleSubmit = async (e: React.FormEvent) => {');
if (tStart > -1) {
    const tNew = `const executeSaveFromPending = () => {
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
    tCode = tCode.slice(0, tStart) + tNew + tCode.slice(tStart);
}
fs.writeFileSync('src/components/TransactionFormModal.tsx', tCode, 'utf8');

console.log("Patched!");
