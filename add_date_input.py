# -*- coding: utf-8 -*-
with open('src/components/TransactionFormModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_str = '''  const [sharesStr, setSharesStr] = useState(defaultShares);'''
new_state_str = '''  const [sharesStr, setSharesStr] = useState(defaultShares);
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));'''
content = content.replace(state_str, new_state_str)

effect_str = '''      setSharesStr(transactionToEdit.shares.toString());
      setNote(transactionToEdit.note || '');'''
new_effect_str = '''      setSharesStr(transactionToEdit.shares.toString());
      setDateStr(new Date(transactionToEdit.date).toISOString().slice(0, 10));
      setNote(transactionToEdit.note || '');'''
content = content.replace(effect_str, new_effect_str)

payload_str = '''        date: transactionToEdit ? transactionToEdit.date : Date.now(),'''
new_payload_str = '''        date: new Date(dateStr).getTime(),'''
content = content.replace(payload_str, new_payload_str)

html_str = '''        <div className=\"grid grid-cols-2 gap-4\">
          <div className=\"space-y-1.5\">
            <label className=\"text-xs font-black text-slate-500\">عدد الأسهم</label>'''
new_html_str = '''        <div className=\"grid grid-cols-2 gap-4\">
          <div className=\"space-y-1.5 col-span-2\">
            <label className=\"text-xs font-black text-slate-500\">تاريخ المعاملة</label>
            <input type=\"date\" required value={dateStr} onChange={e => setDateStr(e.target.value)} className=\"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-center font-bold font-mono-num\" />
          </div>
          <div className=\"space-y-1.5\">
            <label className=\"text-xs font-black text-slate-500\">عدد الأسهم</label>'''
content = content.replace(html_str, new_html_str)

with open('src/components/TransactionFormModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Added date input')
