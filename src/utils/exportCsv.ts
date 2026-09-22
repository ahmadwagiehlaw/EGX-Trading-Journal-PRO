import { type TickerPosition, computePositionMetrics } from './calculations';
import { type Plan } from '../context/TradeContext';

/**
 * Exports all positions into an Excel-friendly CSV with UTF-8 BOM encoding.
 */
export function exportPositionsToCsv(positions: TickerPosition[]): void {
  if (positions.length === 0) {
    alert('لا توجد صفقات لتصديرها حالياً.');
    return;
  }

  const headers = [
    'الرمز (Ticker)',
    'الحالة',
    'الاستراتيجية',
    'متوسط سعر الدخول',
    'الكمية المشتراة',
    'الكمية المتبقية',
    'الوقف الحالي',
    'الهدف',
    'صافي الربح المحقق (EGP)',
    'تاريخ الفتح',
    'تاريخ الإغلاق',
    'الحالة النفسية',
    'الدرس المستفاد',
    'الخطأ الفني',
    'مخالفة لقواعد 3MS'
  ];

  const rows = positions.map((pos) => {
    const metrics = computePositionMetrics(pos);
    const openedDateStr = pos.journal?.openedDate 
      ? new Date(pos.journal.openedDate).toLocaleDateString('ar-EG') 
      : '';
    const closedDateStr = pos.journal?.closedDate 
      ? new Date(pos.journal.closedDate).toLocaleDateString('ar-EG') 
      : '';

    return [
      pos.symbol,
      metrics.isOpen ? 'مفتوحة' : 'مغلقة',
      pos.plan?.strategy || '',
      metrics.avgEntry.toFixed(2),
      metrics.totalBought,
      metrics.openShares,
      metrics.currentStop.toFixed(2),
      pos.plan?.target ? pos.plan.target.toFixed(2) : '',
      metrics.realizedPnL.toFixed(2),
      openedDateStr,
      closedDateStr,
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
  link.setAttribute('download', `EGX_Trades_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
