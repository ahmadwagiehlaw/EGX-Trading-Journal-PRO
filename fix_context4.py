# -*- coding: utf-8 -*-
with open('src/context/TradeContext.tsx', 'r', encoding='utf-8') as f:
    trade_ctx = f.read()

old_str = """    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);"""

new_str = """    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);
    
    const unsubNotes = onSnapshot(collection(db, getPath('sticky_notes')), (snapshot) => {
      const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StickyNote));
      notes.sort((a, b) => b.updatedAt - a.updatedAt);
      setStickyNotes(notes);
    }, handleError);"""

trade_ctx = trade_ctx.replace(old_str, new_str)

old_str2 = """      unsubWeekly();"""
new_str2 = """      unsubWeekly();
      unsubNotes();"""

trade_ctx = trade_ctx.replace(old_str2, new_str2)

with open('src/context/TradeContext.tsx', 'w', encoding='utf-8') as f:
    f.write(trade_ctx)
print("Added onSnapshot")
