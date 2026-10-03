import { AlertOctagon, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          type === 'danger' ? 'bg-rose-500' :
          type === 'warning' ? 'bg-amber-500' :
          'bg-blue-500'
        }`}></div>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            type === 'danger' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
            type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
            'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }`}>
            {type === 'info' ? <CheckCircle2 className="w-7 h-7" /> : <AlertOctagon className="w-7 h-7" />}
          </div>
          
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-black transition-colors ${
                type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' :
                type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
