# -*- coding: utf-8 -*-
with open('src/context/TradeContext.tsx', 'r', encoding='utf-8') as f:
    trade_ctx = f.read()

old_str = """  const deleteWeeklyReview = async (id: string) => {
    await deleteDoc(doc(db, getPath('weekly_reviews'), id));
  };"""

new_str = """  const deleteWeeklyReview = async (id: string) => {
    await deleteDoc(doc(db, getPath('weekly_reviews'), id));
  };

  const addStickyNote = async (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const colRef = collection(db, getPath('sticky_notes'));
    const docRef = doc(colRef);
    const newNote = { ...note, createdAt: Date.now(), updatedAt: Date.now() };
    await setDoc(docRef, newNote);
  };
  
  const updateStickyNote = async (id: string, data: Partial<StickyNote>) => {
    await updateDoc(doc(db, getPath('sticky_notes'), id), { ...data, updatedAt: Date.now() });
  };
  
  const deleteStickyNote = async (id: string) => {
    await deleteDoc(doc(db, getPath('sticky_notes'), id));
  };"""

trade_ctx = trade_ctx.replace(old_str, new_str)

with open('src/context/TradeContext.tsx', 'w', encoding='utf-8') as f:
    f.write(trade_ctx)
print("Added implementations")
