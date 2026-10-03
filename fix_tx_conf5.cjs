const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

// 1. Ensure ConfirmModal is imported
if (!code.includes('ConfirmModal')) {
    code = "import ConfirmModal from './ConfirmModal';\n" + code;
}

// 2. Add pendingSaveData state
const stateHook = "  const [pendingSaveData, setPendingSaveData] = useState<any>(null);";
code = code.replace("  const [error, setError] = useState<string | null>(null);", "  const [error, setError] = useState<string | null>(null);\n" + stateHook);

// 3. Split the logic
const badBlock = `if (amount > availablePower && !transactionToEdit) {
        if (!window.confirm(\`تحذير: سيولة الـ \${portfolioType === 'investment' ? 'استثمار' : 'مضاربة'} المتاحة (\${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (\${formatEGP(amount)}). هل أنت متأكد من الاستمرار (سيتم تجاوز السقف)؟\`)) {
          return;
        }
      }`;

const goodBlock = `if (amount > availablePower && !transactionToEdit) {
        setPendingSaveData({
          msg: \`تحذير: سيولة الـ \${portfolioType === 'investment' ? 'استثمار' : 'مضاربة'} المتاحة (\${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (\${formatEGP(amount)}). هل أنت متأكد من الاستمرار (سيتم تجاوز السقف)؟\`
        });
        return;
      }`;
code = code.replace(badBlock, goodBlock);

// 4. Create proceedWithSave logic
// We need to pull the save logic out of handleSubmit.
// Wait, handleSubmit handles everything after that `if`.
// I'll just change the confirm logic to set the pending save payload and halt.
// When confirmed, we just call a function that contains the rest of the submit block?
// Since it's easier, let's just make `setPendingSaveData` hold the actual transaction object or just a boolean `bypassLiquidityCheck`.
const altBadBlock = `if (amount > availablePower && !transactionToEdit) {`;
const altGoodBlock = `if (amount > availablePower && !transactionToEdit && !pendingSaveData?.bypass) {
        setPendingSaveData({
          bypass: true,
          msg: \`تحذير: سيولة الـ \${portfolioType === 'investment' ? 'استثمار' : 'مضاربة'} المتاحة (\${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (\${formatEGP(amount)}). هل أنت متأكد من الاستمرار (سيتم تجاوز السقف)؟\`
        });
        return;
      }`;

code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
if (!code.includes('ConfirmModal')) {
    code = "import ConfirmModal from './ConfirmModal';\n" + code;
}
code = code.replace("  const [error, setError] = useState<string | null>(null);", "  const [error, setError] = useState<string | null>(null);\n  const [pendingSaveData, setPendingSaveData] = useState<any>(null);\n  const formRef = React.useRef<HTMLFormElement>(null);");

code = code.replace(badBlock, altGoodBlock);

// 5. Add Modal
const modalUI = `
      <ConfirmModal
        isOpen={!!pendingSaveData}
        title="تجاوز السيولة المتاحة"
        message={pendingSaveData?.msg || ''}
        type="warning"
        confirmText="تأكيد الشراء"
        onConfirm={() => {
          if (formRef.current) {
            formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }}
        onCancel={() => setPendingSaveData(null)}
      />
    </div>
  );
}`;

const endHtml = `    </div>
  );
}`;
const lastEnd = code.lastIndexOf(endHtml);
if (lastEnd > -1) {
    code = code.slice(0, lastEnd) + modalUI;
}

// Ensure formRef is attached to the form
code = code.replace('<form onSubmit={handleSubmit} className="p-6 space-y-6">', '<form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">');
// Import React if needed
if (!code.includes('import React')) {
    code = "import React from 'react';\n" + code;
}

fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
console.log("Replaced window.confirm via bypass state");
