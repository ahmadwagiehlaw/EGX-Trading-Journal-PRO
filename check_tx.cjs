const fs = require('fs');
const content = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
if (content.includes('25%')) {
  console.log('Yes! 25% found');
}
if (content.includes('عائمة')) {
  console.log('Yes! عائمة found');
}
