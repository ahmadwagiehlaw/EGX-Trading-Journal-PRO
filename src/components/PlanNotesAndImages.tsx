import { useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import PlanEditor from './PlanEditor';

interface Props {
  notes: string;
  images: string[];
  onChangeNotes: (notes: string) => void;
  onChangeImages: (images: string[]) => void;
}

export default function PlanNotesAndImages({ notes, images, onChangeNotes, onChangeImages }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
              onChangeImages([...images, e.target.result]);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.indexOf('image') !== -1) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
              onChangeImages([...images, e.target.result]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (idx: number) => {
    onChangeImages(images.filter((_, i) => i !== idx));
  };

  return (
    <div 
      className="flex flex-col xl:flex-row gap-5 h-full"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Text Notes Area */}
      <div className="flex-1 min-h-[300px]">
        <PlanEditor content={notes} onChange={onChangeNotes} />
      </div>

      {/* Images Gallery Area */}
      <div className="w-full xl:w-[280px] bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col shrink-0">
        <label className="text-sm font-bold text-slate-500 mb-3 flex items-center justify-between">
          <span>شارتات ومرفقات</span>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{images.length}</span>
        </label>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <img src={img} alt="مرفق" className="w-full h-auto object-cover aspect-video" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
          >
            <ImageIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">الصق (Ctrl+V) أو اضغط للرفع</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={async (e) => {
              if (e.target.files) {
                const newImages: string[] = [];
                for (const file of Array.from(e.target.files)) {
                  const reader = new FileReader();
                  const promise = new Promise<string>((resolve) => {
                    reader.onload = (ev) => resolve(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  });
                  newImages.push(await promise);
                }
                onChangeImages([...images, ...newImages]);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
