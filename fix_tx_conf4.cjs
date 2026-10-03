const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

// 1. Import ConfirmModal
code = "import ConfirmModal from './ConfirmModal';\n" + code;

// 2. Add State for pending save
const stateHook = `  const [pendingSaveData, setPendingSaveData] = useState<any>(null);`;
code = code.replace("  const [price, setPrice] = useState('');", "  const [price, setPrice] = useState('');\n" + stateHook);

// 3. Replace handleSubmit
const oldSubmit = `  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseInt(shares);
    const p = parseFloat(price);
    if (!s || !p || s <= 0 || p <= 0) return;

    if (type === 'sell' && s > (position?.journal?.openShares || 0) && !transactionToEdit) {
      alert('لا يمكنك بيع كمية أكبر من المتاحة!');
      return;
    }

    const payload = {
      type,
      shares: s,
      price: p,
      date: date ? new Date(date).getTime() : Date.now()
    };

    if (type === 'buy' && position) {
      const amount = s * p;
      const portfolioType = position.portfolioType || 'speculation';
      
      const totalOpenCapitalInvestment = positions
        .filter(p => p.portfolioType === 'investment' && p.status === 'active')
        .reduce((sum, p) => sum + (p.journal?.totalInvested || 0), 0);
        
      const totalOpenCapitalSpeculation = positions
        .filter(p => p.portfolioType === 'speculation' && p.status === 'active')
        .reduce((sum, p) => sum + (p.journal?.totalInvested || 0), 0);
        
      const availablePower = portfolioType === 'investment' 
        ? (capitalInvestment - totalOpenCapitalInvestment) 
        : (capitalSpeculation - totalOpenCapitalSpeculation);
      
      if (amount > availablePower && !transactionToEdit) {
        if (!window.confirm(\`تحذير: سيولة الـ \${portfolioType === 'investment' ? 'استثمار' : 'مضاربة'} المتاحة (\${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (\${formatEGP(amount)}). هل أنت متأكد من الاستمرار (قد يؤدي ذلك لسالب في السيولة)؟\`)) {
          return;
        }
      }
    }

    if (transactionToEdit) {
      updateTransaction(position!.id, transactionToEdit.id, payload);
    } else {
      addTransaction(position!.id, payload);
    }
    
    setShares('');
    setPrice('');
    onClose();
  };`;

const newSubmit = `  const proceedWithSave = (dataToSave: any) => {
    if (transactionToEdit) {
      updateTransaction(position!.id, transactionToEdit.id, dataToSave);
    } else {
      addTransaction(position!.id, dataToSave);
    }
    setShares('');
    setPrice('');
    setPendingSaveData(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseInt(shares);
    const p = parseFloat(price);
    if (!s || !p || s <= 0 || p <= 0) return;

    if (type === 'sell' && s > (position?.journal?.openShares || 0) && !transactionToEdit) {
      alert('لا يمكنك بيع كمية أكبر من المتاحة!');
      return;
    }

    const payload = {
      type,
      shares: s,
      price: p,
      date: date ? new Date(date).getTime() : Date.now()
    };

    if (type === 'buy' && position) {
      const amount = s * p;
      const portfolioType = position.portfolioType || 'speculation';
      
      const totalOpenCapitalInvestment = positions
        .filter(p => p.portfolioType === 'investment' && p.status === 'active')
        .reduce((sum, p) => sum + (p.journal?.totalInvested || 0), 0);
        
      const totalOpenCapitalSpeculation = positions
        .filter(p => p.portfolioType === 'speculation' && p.status === 'active')
        .reduce((sum, p) => sum + (p.journal?.totalInvested || 0), 0);
        
      const availablePower = portfolioType === 'investment' 
        ? (capitalInvestment - totalOpenCapitalInvestment) 
        : (capitalSpeculation - totalOpenCapitalSpeculation);
      
      if (amount > availablePower && !transactionToEdit) {
        setPendingSaveData({
           payload,
           msg: \`تحذير: سيولة الـ \${portfolioType === 'investment' ? 'استثمار' : 'مضاربة'} المتاحة (\${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (\${formatEGP(amount)}). هل أنت متأكد من الاستمرار (قد يؤدي ذلك لسالب في السيولة)؟\`
        });
        return;
      }
    }

    proceedWithSave(payload);
  };`;

if (code.includes(oldSubmit)) {
    code = code.replace(oldSubmit, newSubmit);
} else {
    console.log("Could not find oldSubmit block");
}

// 4. Inject ConfirmModal into UI
const endHtml = `    </div>
  );
}`;
const newEndHtml = `      <ConfirmModal
        isOpen={!!pendingSaveData}
        title="تجاوز السيولة المتاحة"
        message={pendingSaveData?.msg || ''}
        type="warning"
        confirmText="تأكيد الشراء"
        onConfirm={() => {
          if (pendingSaveData?.payload) {
             proceedWithSave(pendingSaveData.payload);
          }
        }}
        onCancel={() => setPendingSaveData(null)}
      />
    </div>
  );
}`;
const lastEnd = code.lastIndexOf(endHtml);
if (lastEnd > -1) {
    code = code.slice(0, lastEnd) + newEndHtml;
} else {
    console.log("Could not find end block");
}

fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
console.log("Replaced window.confirm successfully");
