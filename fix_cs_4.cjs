const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Add coreShares state after isEditingStop state block
const insertAfter = `  const [isEditingStop, setIsEditingStop] = useState(false);
  const [manualStopInput, setManualStopInput] = useState('');`;

const coreSharesState = `
  const [isEditingCoreShares, setIsEditingCoreShares] = useState(false);
  const [coreSharesInput, setCoreSharesInput] = useState('');`;

at = at.replace(insertAfter, insertAfter + coreSharesState);

// Add handleSaveCoreShares function before the early return (search for "if (!position || !metrics) return null;")
const beforeEarlyReturn = `  if (!position || !metrics) return null;`;
const coreSharesHandler = `  const handleSaveCoreShares = async () => {
    if (!position || !metrics) return;
    const val = parseInt(coreSharesInput);
    if (!isNaN(val) && val >= 0 && val <= metrics!.openShares) {
      await updatePosition(position!.id, { coreShares: val });
      setIsEditingCoreShares(false);
    }
  };

`;
at = at.replace(beforeEarlyReturn, coreSharesHandler + beforeEarlyReturn);

fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
console.log('✓ coreShares state and handler added');
