# -*- coding: utf-8 -*-
with open('src/context/TradeContext.tsx', 'r', encoding='utf-8') as f:
    trade_ctx = f.read()

# Fix provider value missing stickyNotes properly
if 'stickyNotes,' not in trade_ctx[trade_ctx.rfind('value={{'):]:
    trade_ctx = trade_ctx.replace('deleteWeeklyReview,\n        isSimulator,', 'deleteWeeklyReview,\n        stickyNotes,\n        addStickyNote,\n        updateStickyNote,\n        deleteStickyNote,\n        isSimulator,')
    print("Replaced inside value={{")
else:
    print("Already in value={{")

with open('src/context/TradeContext.tsx', 'w', encoding='utf-8') as f:
    f.write(trade_ctx)

with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
# Remove unused
content = content.replace('const [isEditingStop, setIsEditingStop] = useState(false);', '')
content = content.replace('const [manualStopInput, setManualStopInput] = useState(\'\');', '')
content = content.replace('const [isEditingInitStop, setIsEditingInitStop] = useState(false);', '')
content = content.replace('const [initStopInput, setInitStopInput] = useState(\'\');', '')

import re
content = re.sub(r'const handleManualStopUpdate = async \(\) => {[\s\S]*?setIsEditingStop\(false\);\n  };', '', content)
content = re.sub(r'const handleInitialStopUpdate = async \(\) => {[\s\S]*?setIsEditingInitStop\(false\);\n  };', '', content)

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed ActiveTrades.tsx')

with open('src/components/StickyNotesPanel.tsx', 'r', encoding='utf-8') as f:
    notes = f.read()
notes = notes.replace('import React, { useState, useEffect } from \'react\';', 'import { useState } from \'react\';')
notes = notes.replace(', Image as ImageIcon', '')
with open('src/components/StickyNotesPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(notes)
print('Fixed StickyNotesPanel')

