import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, CheckCircle, X } from 'lucide-react';

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-[100] animate-in slide-in-from-bottom-5 duration-300" dir="rtl">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-center justify-between gap-3 backdrop-blur-md bg-slate-900/95">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
            {needRefresh ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-100">
              {needRefresh ? 'تحديث جديد متوفر!' : 'جاهز للعمل بدون إنترنت'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 font-bold">
              {needRefresh 
                ? 'اضغط هنا لتحديث التطبيق إلى أحدث إصدار فوراً.' 
                : 'تم حفظ كافة ملفات التطبيق للعمل بدون شبكة.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95"
            >
              تحديث
            </button>
          )}
          <button
            onClick={close}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
