import { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone (installed) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || dismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed top-3 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 shadow-2xl border border-indigo-500/30 backdrop-blur-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-black">تثبيت التطبيق على جهازك</h4>
          <p className="text-[10px] text-slate-300 font-bold flex items-center gap-1.5 mt-0.5">
            <Smartphone className="w-3 h-3 text-amber-400" /> يعمل للموبايل والكمبيوتر كبرنامج مستقل
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          <span>تثبيت</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
