import { type TickerPosition, computePositionMetrics } from './calculations';
import { type Plan } from '../context/TradeContext';

export interface ExportFilterOptions {
  portfolioType?: 'all' | 'investment' | 'speculation';
  status?: 'all' | 'active' | 'closed';
  commissionRate?: number;
}

/**
 * Exports positions into an Excel-friendly CSV with comprehensive financial columns & UTF-8 BOM encoding.
 */
export function exportPositionsToCsv(positions: TickerPosition[], options: ExportFilterOptions = {}): void {
  const { portfolioType = 'all', status = 'all', commissionRate = 0.003 } = options;

  let filtered = positions;
  if (portfolioType !== 'all') {
    filtered = filtered.filter(p => (p.portfolioType || 'investment') === portfolioType);
  }
  if (status !== 'all') {
    filtered = filtered.filter(p => {
      const m = computePositionMetrics(p, commissionRate);
      const isActive = p.status === 'active' && m.openShares > 0;
      return status === 'active' ? isActive : !isActive;
    });
  }

  if (filtered.length === 0) {
    alert('لا توجد صفقات تطابق خيارات التصدير المحددة.');
    return;
  }

  const headers = [
    'الرمز (Ticker)',
    'نوع المحفظة',
    'الحالة',
    'الاستراتيجية',
    'متوسط سعر الدخول',
    'الكمية المشتراة',
    'الكمية المتبقية',
    'سعر السوق الحالي',
    'الوقف الحالي',
    'الهدف',
    'إجمالي العمولات والدمغة (EGP)',
    'إجمالي الربح قبل العمولة (Gross)',
    'صافي الربح المحقق (Net P&L)',
    'العائد المحقق %',
    'تاريخ الفتح',
    'تاريخ الإغلاق',
    'أيام الاحتفاظ',
    'الحالة النفسية',
    'الدرس المستفاد',
    'الخطأ الفني',
    'مخالفة لقواعد التداول'
  ];

  const rows = filtered.map((pos) => {
    const metrics = computePositionMetrics(pos, commissionRate);
    const openedDateStr = pos.journal?.openedDate 
      ? new Date(pos.journal.openedDate).toLocaleDateString('ar-EG') 
      : '';
    const closedDateStr = pos.journal?.closedDate 
      ? new Date(pos.journal.closedDate).toLocaleDateString('ar-EG') 
      : '';

    let holdingDays = 0;
    if (pos.journal?.openedDate) {
      const end = pos.journal?.closedDate || Date.now();
      holdingDays = Math.max(1, Math.round((end - pos.journal.openedDate) / (1000 * 60 * 60 * 24)));
    }

    const costBasis = metrics.totalBought > 0 ? metrics.totalBought * metrics.avgEntry : 0;
    const returnPct = costBasis > 0 ? (metrics.netRealizedPnL / costBasis) * 100 : 0;

    return [
      pos.symbol,
      pos.portfolioType === 'speculation' ? 'مضاربة' : 'استثمار',
      metrics.isOpen ? 'نشطة' : 'مغلقة',
      pos.plan?.strategy || '',
      metrics.avgEntry.toFixed(2),
      metrics.totalBought,
      metrics.openShares,
      (pos.currentMarketPrice || metrics.currentPrice).toFixed(2),
      metrics.currentStop.toFixed(2),
      pos.plan?.target ? pos.plan.target.toFixed(2) : '',
      metrics.totalCommission.toFixed(2),
      metrics.realizedPnL.toFixed(2),
      metrics.netRealizedPnL.toFixed(2),
      `${returnPct.toFixed(1)}%`,
      openedDateStr,
      closedDateStr,
      holdingDays,
      pos.journal?.emotion || 'neutral',
      `"${(pos.journal?.lessonLearned || '').replace(/"/g, '""')}"`,
      `"${(pos.journal?.mistake || '').replace(/"/g, '""')}"`,
      pos.journal?.isRuleBreaker ? 'نعم' : 'لا'
    ].join(',');
  });

  // Prepend UTF-8 BOM so Excel opens Arabic correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filterTag = portfolioType !== 'all' ? `_${portfolioType}` : '';
  link.setAttribute('download', `EGX_Trades_Report${filterTag}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports all plans into an Excel-friendly CSV.
 */
export function exportPlansToCsv(plans: Plan[]): void {
  if (plans.length === 0) {
    alert('لا توجد خطط مراقبة لتصديرها.');
    return;
  }

  const headers = [
    'الرمز',
    'الحالة',
    'الاستراتيجية',
    'الحد الأدنى للدخول',
    'الحد الأقصى للدخول',
    'الهدف',
    'الوقف',
    'تاريخ الإنشاء'
  ];

  const rows = plans.map((p) => {
    const min = p.entryZone?.min ?? p.entry ?? 0;
    const max = p.entryZone?.max ?? p.entry ?? min;
    const createdStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('ar-EG') : '';

    return [
      p.symbol,
      p.status === 'ready' ? 'جاهز للتنفيذ' : 'قيد المتابعة',
      p.strategy,
      min.toFixed(2),
      max.toFixed(2),
      p.target.toFixed(2),
      p.stop.toFixed(2),
      createdStr
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `EGX_Watchlist_Plans_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
