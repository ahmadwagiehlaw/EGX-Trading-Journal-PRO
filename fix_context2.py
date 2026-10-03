# -*- coding: utf-8 -*-
with open('src/context/TradeContext.tsx', 'r', encoding='utf-8') as f:
    trade_ctx = f.read()

old_str = """    weeklyReviews,
    addWeeklyReview,
    updateWeeklyReview,
    deleteWeeklyReview,"""

new_str = """    weeklyReviews,
    addWeeklyReview,
    updateWeeklyReview,
    deleteWeeklyReview,
    stickyNotes,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,"""

trade_ctx = trade_ctx.replace(old_str, new_str)

with open('src/context/TradeContext.tsx', 'w', encoding='utf-8') as f:
    f.write(trade_ctx)
print("Fixed contextValue")
