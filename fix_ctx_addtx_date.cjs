const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const sIdx = code.indexOf('const addTransaction = async');
const eIdx = code.indexOf('await updateDoc(doc(db, \'trades\', positionId), updatePayload);', sIdx);

let oldLogic = code.slice(sIdx, eIdx);

const newLogic = `const addTransaction = async (positionId: string, tx: Omit<Transaction, 'id'>) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    const newTxId = 'tx_' + Math.random().toString(36).substring(2, 8);
    const newTx: Transaction = {
      ...tx,
      id: newTxId,
      amount: tx.shares * tx.price,
    };

    const updatedTransactions = [...(pos.transactions || []), newTx];
    
    // Check if after this transaction all shares are sold
    const openShares = computeOpenShares(updatedTransactions);
    const newStatus: TickerPosition['status'] = openShares === 0 ? 'closed' : 'active';
    const realizedPnL = computeRealizedPnL(updatedTransactions);

    const updatePayload: any = {
      transactions: updatedTransactions,
      status: newStatus,
      pnl: realizedPnL,
    };

    // If this is the FIRST transaction, sync the openedDate to the transaction date
    if ((!pos.transactions || pos.transactions.length === 0) && newTx.type === 'buy') {
      updatePayload['journal.openedDate'] = newTx.date;
    }

    // If position closed, sync the closedDate to the transaction date
    if (newStatus === 'closed') {
      updatePayload['journal.closedDate'] = newTx.date;
    }

    `;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log("Updated addTransaction date logic");
