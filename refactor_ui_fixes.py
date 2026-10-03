# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the massive space and Tabs styling
old_tabs_header = '<div className="flex items-center gap-2 mt-8 mb-6 border-b border-slate-200 dark:border-slate-800">'
new_tabs_header = '<div className="flex overflow-x-auto hide-scrollbar items-center gap-4 mt-2 mb-4 border-b border-slate-200 dark:border-slate-800 w-full">'
content = content.replace(old_tabs_header, new_tabs_header)

# Make tabs never wrap
content = content.replace(
    'className={`pb-3 px-4 font-black text-sm border-b-2 transition-colors ${leftTab',
    'className={`pb-3 px-2 md:px-4 font-black text-xs md:text-sm whitespace-nowrap border-b-2 transition-colors ${leftTab'
)

# 2. Add Edit button to Transaction Table
table_actions_old = """                         <td className="py-4 px-2 flex justify-center">
                            <button 
                              onClick={() => setConfirmTxId(tx.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" 
                              title="حذف المعاملة"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </button>
                         </td>"""
                         
table_actions_new = """                         <td className="py-4 px-2 flex justify-center gap-1">
                            <button 
                              onClick={() => { setTxModalType('edit'); setEditingTx(tx); }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                              title="تعديل المعاملة"
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
content = content.replace(table_actions_old.replace('حذف المعاملة', '?? ????????'), table_actions_new)

# Oh wait, because of Powershell utf-8 encoding/decoding, finding exact arabic strings might fail.
# Let's use `content.find('setConfirmTxId(tx.id)')`
idx_confirm = content.find('onClick={() => setConfirmTxId(tx.id)}')
if idx_confirm != -1:
    idx_td_start = content.rfind('<td', 0, idx_confirm)
    idx_td_end = content.find('</td>', idx_confirm) + 5
    if idx_td_start != -1 and idx_td_end != -1:
        old_td = content[idx_td_start:idx_td_end]
        # We can just manually replace this block
        new_td = """<td className="py-4 px-2 flex justify-center gap-1">
                            <button 
                              onClick={() => { setTxModalType('edit'); setEditingTx(tx); }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                              title="تعديل المعاملة"
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
        content = content.replace(old_td, new_td)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("UI fixed")
