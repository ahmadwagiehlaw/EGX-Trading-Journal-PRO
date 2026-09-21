import { useRef } from 'react';
import { Image as ImageIcon, X, Plus } from 'lucide-react';

export interface PlanUpdate {
  id: string;
  text: string;
  image?: string;
}

interface Props {
  updates: PlanUpdate[];
  onChange: (updates: PlanUpdate[]) => void;
}

export default function PlanUpdatesFeed({ updates, onChange }: Props) {
  
  const addUpdate = () => {
    onChange([...updates, { id: Date.now().toString(), text: '', image: '' }]);
  };

  const removeUpdate = (id: string) => {
    onChange(updates.filter(u => u.id !== id));
  };

  const updateText = (id: string, text: string) => {
    onChange(updates.map(u => u.id === id ? { ...u, text } : u));
  };

  const updateImage = (id: string, image: string) => {
    onChange(updates.map(u => u.id === id ? { ...u, image } : u));
  };

  // If empty, ensure there's at least one block to write in
  if (updates.length === 0) {
    // We don't automatically call onChange during render, so just show a button to start
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-500">سجل الملاحظات والتحديثات</label>
        <button 
          onClick={addUpdate}
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة ملاحظة
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {updates.length === 0 && (
          <div className="text-center py-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-sm mb-3">لا توجد ملاحظات لهذه الخطة بعد.</p>
            <button 
              onClick={addUpdate}
              className="bg-white hover:bg-slate-50 text-slate-700 text-sm font-black px-4 py-2 rounded-xl border border-slate-200 shadow-sm inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-500" />
              ابدأ بكتابة خطتك الآن
            </button>
          </div>
        )}

        {updates.map((update, index) => (
          <UpdateBlock 
            key={update.id}
            update={update}
            onTextChange={(val) => updateText(update.id, val)}
            onImageChange={(val) => updateImage(update.id, val)}
            onRemove={() => removeUpdate(update.id)}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

function UpdateBlock({ 
  update, 
  onTextChange, 
  onImageChange, 
  onRemove,
  isFirst
}: { 
  update: PlanUpdate; 
  onTextChange: (t: string) => void; 
  onImageChange: (i: string) => void; 
  onRemove: () => void;
  isFirst: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (typeof ev.target?.result === 'string') {
              onImageChange(ev.target.result);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  return (
    <div className="relative flex gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-blue-400 focus-within:shadow-md transition-all group">
      
      {/* Delete Button */}
      <button 
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
        title="حذف الملاحظة"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Text Area */}
      <div className="flex-1">
        <textarea
          value={update.text}
          onChange={(e) => onTextChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={isFirst ? "اكتب تفاصيل خطتك هنا... (يمكنك لصق صورة بالشارت بـ Ctrl+V)" : "تحديث جديد أو ملاحظة إضافية..."}
          className="w-full h-full min-h-[100px] resize-none outline-none text-slate-700 bg-transparent text-sm font-bold leading-relaxed placeholder:text-slate-300 placeholder:font-normal"
        />
      </div>

      {/* Image Area (Fixed Square on the left) */}
      <div className="w-32 h-32 shrink-0">
        {update.image ? (
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-200 group/img">
            <img src={update.image} alt="شارت" className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(update.image, '_blank')} />
            <button 
              onClick={() => onImageChange('')}
              className="absolute top-1 right-1 bg-slate-900/70 hover:bg-red-600 text-white p-1 rounded-lg backdrop-blur-sm opacity-0 group-hover/img:opacity-100 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <ImageIcon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold text-center px-2">اضغط للرفع<br/>أو الصق (Ctrl+V)</span>
          </button>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => {
            if (e.target.files?.[0]) {
              const file = e.target.files[0];
              const reader = new FileReader();
              reader.onload = (ev) => {
                if (typeof ev.target?.result === 'string') {
                  onImageChange(ev.target.result);
                }
              };
              reader.readAsDataURL(file);
            }
          }}
        />
      </div>
    </div>
  );
}
