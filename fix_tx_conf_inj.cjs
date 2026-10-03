const fs = require('fs');
let txCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

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
`;

const target = '</form>';
const targetIdx = txCode.lastIndexOf(target);
if (targetIdx > -1) {
    txCode = txCode.slice(0, targetIdx) + modalUI + txCode.slice(targetIdx);
    fs.writeFileSync('src/components/TransactionFormModal.tsx', txCode, 'utf8');
    console.log("Injected ConfirmModal before </form>");
}
