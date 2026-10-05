import { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { X, Plus, Trash2, Save, Pin } from 'lucide-react';
import type { StickyNote } from '../context/TradeContext';

export default function StickyNotesPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { stickyNotes, addStickyNote, updateStickyNote, deleteStickyNote } = useTrades();
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('bg-yellow-50 dark:bg-yellow-900/30');
  
  const colors = [
    'bg-yellow-50 dark:bg-yellow-900/30',
    'bg-blue-50 dark:bg-blue-900/30',
    'bg-emerald-50 dark:bg-emerald-900/30',
    'bg-pink-50 dark:bg-pink-900/30',
    'bg-purple-50 dark:bg-purple-900/30',
    'bg-white dark:bg-slate-800'
  ];

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      if (editingNoteId && editingNoteId !== 'new') {
        // If they cleared out a note completely, delete it instead
        await deleteStickyNote(editingNoteId);
      }
      setEditingNoteId(null);
      return;
    }
    
    if (editingNoteId && editingNoteId !== 'new') {
      await updateStickyNote(editingNoteId, { title, content, color });
      setEditingNoteId(null);
    } else {
      await addStickyNote({ title, content, color, images: [] });
      setEditingNoteId(null);
    }
    setTitle('');
    setContent('');
  };

  const startEdit = (n: StickyNote) => {
    setEditingNoteId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setColor(n.color || colors[0]);
  };

  const startCreate = () => {
    setEditingNoteId('new');
    setTitle('');
    setContent('');
    setColor(colors[0]);
  };

  // Prevent background clicks when typing
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity" onClick={() => {
        if (editingNoteId) handleSave();
        onClose();
      }} />
      
      <div className="fixed top-0 left-0 bottom-0 w-full max-w-md bg-slate-50 dark:bg-slate-900 z-50 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col" dir="rtl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-lg">
              <Pin className="w-5 h-5" />
            </div>
            <h2 className="font-black text-lg text-slate-800 dark:text-slate-100">ملاحظات سريعة</h2>
          </div>
          <div className="flex items-center gap-2">
            {!editingNoteId && (
              <button onClick={startCreate} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => { if (editingNoteId) handleSave(); onClose(); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {editingNoteId ? (
            <div className={`p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 ${color}`}>
              <input
                type="text"
                placeholder="عنوان الملاحظة..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-black text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none mb-3 border-b border-black/5 dark:border-white/10 pb-2"
                autoFocus
              />
              <textarea
                placeholder="اكتب أفكارك وملاحظاتك حول السوق أو صفقاتك القادمة..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none resize-none min-h-[150px] leading-relaxed"
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5 dark:border-white/10">
                <div className="flex gap-1.5">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-slate-800 dark:border-white' : 'border-transparent shadow-sm'} ${c}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingNoteId(null); }} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors">إلغاء</button>
                  <button onClick={handleSave} className="text-xs font-black px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-lg">
                    <Save className="w-3.5 h-3.5" /> حفظ
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {!editingNoteId && stickyNotes.sort((a,b)=>b.updatedAt - a.updatedAt).map(note => (
            <div key={note.id} className={`group relative p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 ${note.color || 'bg-yellow-50 dark:bg-yellow-900/30'} transition-all hover:shadow-md cursor-pointer`} onClick={() => startEdit(note)}>
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => deleteStickyNote(note.id)} className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
              
              {note.title && <h3 className="font-black text-slate-800 dark:text-slate-100 mb-2 pr-1">{note.title}</h3>}
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pr-1">
                {note.content}
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] font-bold text-slate-500 pr-1">
                {new Date(note.updatedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {!editingNoteId && stickyNotes.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <Pin className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-400">لا توجد ملاحظات مسجلة.</p>
              <p className="text-xs mt-1 text-slate-500">اضغط على + لإضافة ملاحظة جديدة.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
