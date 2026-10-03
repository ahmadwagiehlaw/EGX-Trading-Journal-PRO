# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = """                          <td className="py-4 px-2 flex justify-center">
                             <button 
                               onClick={() => setConfirmTxId(tx.id)}
                               className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" 
                               title="حذف المعاملة"
                             >
                               <Trash2 className="w-4 h-4"/>
                             </button>
                          </td>"""

new_str = """                          <td className="py-4 px-2 flex justify-center gap-1">
                             <button 
                               onClick={() => { setEditingTx(tx); setTxModalType('edit'); }}
                               className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                               title="تعديل"
                             >
                               <Pencil className="w-4 h-4"/>
                             </button>
                             <button 
                               onClick={() => setConfirmTxId(tx.id)}
                               className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" 
                               title="حذف المعاملة"
                             >
                               <Trash2 className="w-4 h-4"/>
                             </button>
                          </td>"""

content = content.replace(old_str, new_str)
with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced button')
