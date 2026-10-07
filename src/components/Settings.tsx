import ConfirmModal from './ConfirmModal';
import { useState, useEffect } from 'react';
import { 
  Save, 
  Download, 
  Trash2, 
  Wallet, 
  ShieldCheck, 
  Database, 
  Info, 
  CheckCircle,
  FileSpreadsheet,
  FileJson,
  ImageIcon,
  Lock,
  X
} from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { exportPositionsToCsv, exportPlansToCsv } from '../utils/exportCsv';

export default function Settings() {
  const { 
    capitalInvestment, 
    capitalSpeculation, 
    positions, 
    plans, 
    commissionRate, 
    updateCommissionRate,
    defaultRisk: contextDefaultRisk,
    updateDefaultRisk,
    clearAllData
  } = useTrades();
  const [confirmReset, setConfirmReset] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPortfolio, setExportPortfolio] = useState<'all' | 'investment' | 'speculation'>('all');
  const [exportStatus, setExportStatus] = useState<'all' | 'active' | 'closed'>('all');
  
  // Local state initialized with fallbacks
  const [defaultRisk, setDefaultRisk] = useState(() => (contextDefaultRisk !== undefined && contextDefaultRisk !== null ? contextDefaultRisk.toString() : (localStorage.getItem('egx_risk_per_trade_pct') || '1')));
  const [commission, setCommission] = useState(() => (commissionRate !== undefined && commissionRate !== null ? commissionRate.toString() : '0.003'));
  const [imageProvider, setImageProvider] = useState(() => localStorage.getItem('egx_image_provider') || 'imgbb');
  const [imageKey, setImageKey] = useState(() => localStorage.getItem('egx_image_key') || '');
  const [imageEndpoint, setImageEndpoint] = useState(() => localStorage.getItem('egx_image_endpoint') || '');
  const [privacyPin, setPrivacyPin] = useState(() => localStorage.getItem('egx_privacy_pin') || '');

  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (commissionRate !== undefined && commissionRate !== null) {
      setCommission(commissionRate.toString());
    }
  }, [commissionRate]);

  useEffect(() => {
    if (contextDefaultRisk !== undefined && contextDefaultRisk !== null) {
      setDefaultRisk(contextDefaultRisk.toString());
    }
  }, [contextDefaultRisk]);

  const handleSave = async () => {
    const commVal = parseFloat(commission);
    if (!isNaN(commVal) && updateCommissionRate) {
      await updateCommissionRate(commVal);
    }
    
    const riskVal = parseFloat(defaultRisk);
    if (!isNaN(riskVal) && updateDefaultRisk) {
      await updateDefaultRisk(riskVal);
    }
    
    localStorage.setItem('egx_risk_per_trade_pct', defaultRisk);
    localStorage.setItem('egx_image_provider', imageProvider);
    localStorage.setItem('egx_image_key', imageKey.trim());
    localStorage.setItem('egx_image_endpoint', imageEndpoint.trim());
    localStorage.setItem('egx_privacy_pin', privacyPin.trim());

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleExportJson = () => {
    const backupData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      capital: { investment: capitalInvestment, speculation: capitalSpeculation },
      positions,
      plans,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EGX_Journal_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => setConfirmReset(true);

  const executeClearData = async () => {
    try {
      setIsClearing(true);
      if (clearAllData) {
        await clearAllData();
      } else {
        localStorage.clear();
      }
      window.location.reload();
    } catch (error: any) {
      alert('حدث خطأ أثناء مسح البيانات: ' + error.message);
    } finally {
      setIsClearing(false);
      setConfirmReset(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6" dir="rtl">
      
      {/* Save Button Row */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">إعدادات الحساب والمحفظة</h2>
        <button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 text-sm active:scale-95"
        >
          <Save className="w-4 h-4" />
          حفظ الإعدادات
        </button>
      </div>

      {savedMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          تم حفظ الإعدادات بنجاح.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Capital Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">إعدادات المحفظة (رأس المال)</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-black text-blue-900 dark:text-blue-300">تم ترقية نظام إدارة رأس المال! 🚀</p>
                <p className="text-xs font-bold text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  لم يعد رأس المال مجرد رقم ثابت يتم تعديله هنا. الآن أصبح لديك <span className="text-blue-700 dark:text-blue-400 font-black">"سجل خزينة"</span> متكامل يسجل كل حركات الإيداع والسحب الخاصة بك.
                </p>
                <p className="text-xs font-bold text-blue-800/80 dark:text-blue-300/80 leading-relaxed mt-2">
                  👉 لإضافة أو تعديل رأس مالك، توجه إلى شاشة <span className="font-black bg-blue-100 dark:bg-blue-900 px-1 rounded text-blue-700 dark:text-blue-400">الداشبورد</span> واضغط على زر سجل السحب والإيداع.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Management Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">إدارة المخاطر والعمولات</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">نسبة المخاطرة الافتراضية لكل صفقة (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={defaultRisk}
                onChange={(e) => setDefaultRisk(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white font-black text-sm focus:border-emerald-500 outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">نسبة عمولة الوسيط والرسوم (0.003 = 0.3%)</label>
              <input 
                type="number" 
                step="0.0005"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white font-black text-sm focus:border-emerald-500 outline-none"
                dir="ltr"
              />
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 leading-relaxed">
              تُحسب العمولات والدمغة تلقائياً لحساب صافي الأرباح المحققة بعد المصاريف (Net P&L).
            </p>
          </div>
        </div>

        {/* Image Storage & Cloud Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <ImageIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">تخزين صور الشارتات والتحليلات</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">مزود تخزين الصور المفضل</label>
              <select
                value={imageProvider}
                onChange={(e) => setImageProvider(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white font-black text-sm focus:border-indigo-500 outline-none"
              >
                <option value="imgbb">ImgBB السحابي (تلقائي وسريع)</option>
                <option value="cloudflare">Cloudflare R2 / Custom Endpoint</option>
                <option value="local">تخزين محلي فائق السرعة على الجهاز (IndexedDB)</option>
              </select>
            </div>

            {imageProvider === 'cloudflare' && (
              <div className="space-y-3 p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">رابط الرفع (Worker / API Endpoint)</label>
                  <input 
                    type="url"
                    placeholder="https://your-worker.yourname.workers.dev"
                    value={imageEndpoint}
                    onChange={(e) => setImageEndpoint(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-mono-num font-bold text-slate-900 dark:text-white outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مفتاح الحماية / Token (اختياري)</label>
                  <input 
                    type="password"
                    placeholder="API Token..."
                    value={imageKey}
                    onChange={(e) => setImageKey(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-mono-num font-bold text-slate-900 dark:text-white outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 leading-relaxed">
                يتم ضغط جميع الصور محلياً بصيغة WebP خفيفة للغاية، مما يحافظ على سرعة التطبيق ويوفر استهلاك البيانات.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Security PIN */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Lock className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">قفل الخصوصية الشخصي (PIN Lock)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">رمز PIN المكون من 4 أرقام (اتركه فارغاً لإلغاء القفل)</label>
              <input 
                type="password" 
                maxLength={4}
                placeholder="مثال: 1234"
                value={privacyPin}
                onChange={(e) => setPrivacyPin(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white font-mono-num font-black text-sm tracking-widest text-center focus:border-amber-500 outline-none"
                dir="ltr"
              />
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/60 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300 leading-relaxed">
                رمز الحماية يُحفظ بأمان في متصفحك لمنع أي شخص متطفل على جهازك من الاطلاع على أرقام محفظتك وصفقاتك.
              </p>
            </div>
          </div>
        </div>

        {/* Data Export & Backup Management */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">إدارة البيانات، النسخ الاحتياطي وتصدير Excel</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Export to Excel (Positions) */}
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-2xl transition-all gap-2.5 group text-center"
            >
              <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="font-black text-xs text-slate-800 dark:text-white">تصدير الصفقات Excel / CSV</span>
              <span className="text-[10px] text-slate-400 font-bold">تصدير مخصص مع فلاتر</span>
            </button>

            {/* Export Watchlist Plans to CSV */}
            <button 
              onClick={() => exportPlansToCsv(plans)}
              className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-slate-200 dark:border-slate-700 hover:border-orange-300 rounded-2xl transition-all gap-2.5 group text-center"
            >
              <div className="w-11 h-11 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <span className="font-black text-xs text-slate-800 dark:text-white">تصدير خطط المراقبة CSV</span>
              <span className="text-[10px] text-slate-400 font-bold">حفظ قوائم المراقبة كملف</span>
            </button>

            {/* JSON Backup */}
            <button 
              onClick={handleExportJson}
              className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-blue-300 rounded-2xl transition-all gap-2.5 group text-center"
            >
              <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileJson className="w-5 h-5" />
              </div>
              <span className="font-black text-xs text-slate-800 dark:text-white">نسخة احتياطية كاملة (JSON)</span>
              <span className="text-[10px] text-slate-400 font-bold">حفظ قاعدة البيانات السحابية</span>
            </button>

            {/* Reset / Clear Data */}
            <button 
              onClick={handleClearData}
              className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 hover:border-red-300 rounded-2xl transition-all gap-2.5 group text-center"
            >
              <div className="w-11 h-11 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="font-black text-xs text-red-700 dark:text-red-500">تصفير سجل الصفقات</span>
              <span className="text-[10px] text-slate-400 font-bold">حذف البيانات وبدء سجل جديد</span>
            </button>

          </div>
        </div>

      </div>
    
      {/* Export Options Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExportModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">تصدير الصفقات إلى Excel / CSV</h3>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Portfolio Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400">تصفية حسب نوع المحفظة:</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'investment', label: 'استثمار' },
                    { id: 'speculation', label: 'مضاربة' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExportPortfolio(opt.id as any)}
                      className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                        exportPortfolio === opt.id 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400">تصفية حسب حالة الصفقات:</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'active', label: 'نشطة فقط' },
                    { id: 'closed', label: 'مغلقة فقط' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExportStatus(opt.id as any)}
                      className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                        exportStatus === opt.id 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  exportPositionsToCsv(positions, {
                    portfolioType: exportPortfolio,
                    status: exportStatus,
                    commissionRate
                  });
                  setIsExportModalOpen(false);
                }}
                className="flex-1 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                تحميل الملف (CSV)
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmReset}
        title="مسح جميع البيانات"
        message={isClearing ? "جاري مسح جميع الصفقات والخطط وقاعدة البيانات من السحابة..." : "تحذير: سيتم مسح جميع الصفقات والخطط وحركات الخزينة والملاحظات من السحابة نهائياً وتصفير الحساب. لا يمكن التراجع عن هذه الخطوة!"}
        type="danger"
        confirmText={isClearing ? "جاري المسح..." : "نعم، امسح كل شيء"}
        onConfirm={executeClearData}
        onCancel={() => !isClearing && setConfirmReset(false)}
      />
    </div>
  );
}