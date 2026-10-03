# -*- coding: utf-8 -*-
import sys

with open('src/context/TradeContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add interface
interface_code = '''export interface StickyNote {
  id: string;
  title: string;
  content: string;
  images?: string[];
  createdAt: number;
  updatedAt: number;
  color?: string;
}

export interface WeeklyReview {'''

content = content.replace('export interface WeeklyReview {', interface_code)

# Add to context type
ctx_type_str = '''  weeklyReviews: WeeklyReview[];
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => Promise<void>;
  updateWeeklyReview: (id: string, data: Partial<WeeklyReview>) => Promise<void>;
  deleteWeeklyReview: (id: string) => Promise<void>;'''

new_ctx_type_str = '''  weeklyReviews: WeeklyReview[];
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => Promise<void>;
  updateWeeklyReview: (id: string, data: Partial<WeeklyReview>) => Promise<void>;
  deleteWeeklyReview: (id: string) => Promise<void>;
  
  stickyNotes: StickyNote[];
  addStickyNote: (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStickyNote: (id: string, data: Partial<StickyNote>) => Promise<void>;
  deleteStickyNote: (id: string) => Promise<void>;'''

content = content.replace(ctx_type_str, new_ctx_type_str)

# Add state and functions
state_str = '''  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);'''

new_state_str = '''  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);'''

content = content.replace(state_str, new_state_str)

funcs_str = '''  const deleteWeeklyReview = async (id: string) => {
    await deleteDoc(doc(db, getPath('weekly_reviews'), id));
  };'''

new_funcs_str = '''  const deleteWeeklyReview = async (id: string) => {
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
  };'''

content = content.replace(funcs_str, new_funcs_str)

# Add to loadUserData snapshot
load_str = '''      const reviewsSnapshot = await getDocs(collection(db, getPath('weekly_reviews')));
      setWeeklyReviews(reviewsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview)));'''

new_load_str = '''      const reviewsSnapshot = await getDocs(collection(db, getPath('weekly_reviews')));
      setWeeklyReviews(reviewsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview)));
      
      const notesSnapshot = await getDocs(collection(db, getPath('sticky_notes')));
      setStickyNotes(notesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as StickyNote)));'''

content = content.replace(load_str, new_load_str)

# Add to provider value
provider_val = '''        deleteWeeklyReview,
        isSimulator,'''

new_provider_val = '''        deleteWeeklyReview,
        stickyNotes,
        addStickyNote,
        updateStickyNote,
        deleteStickyNote,
        isSimulator,'''

content = content.replace(provider_val, new_provider_val)

with open('src/context/TradeContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Added StickyNotes to TradeContext')
