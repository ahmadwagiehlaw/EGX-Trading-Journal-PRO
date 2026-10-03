# -*- coding: utf-8 -*-
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix default export
content = content.replace('function App() {', 'export default function App() {')

# Fix isNotesOpen state
if 'const [isNotesOpen' not in content:
    content = content.replace('const [activeTab, setActiveTab]', 'const [isNotesOpen, setIsNotesOpen] = useState(false);\n  const [activeTab, setActiveTab]')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed App.tsx')

with open('src/context/TradeContext.tsx', 'r', encoding='utf-8') as f:
    trade_ctx = f.read()

# Fix provider value missing stickyNotes
if 'stickyNotes,' not in trade_ctx[trade_ctx.rfind('value={{'):]:
    trade_ctx = trade_ctx.replace('deleteWeeklyReview,\n        isSimulator,', 'deleteWeeklyReview,\n        stickyNotes,\n        addStickyNote,\n        updateStickyNote,\n        deleteStickyNote,\n        isSimulator,')

with open('src/context/TradeContext.tsx', 'w', encoding='utf-8') as f:
    f.write(trade_ctx)
print('Fixed TradeContext.tsx')
