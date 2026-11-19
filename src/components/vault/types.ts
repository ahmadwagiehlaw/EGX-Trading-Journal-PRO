export type AssetKey = 'cash' | 'clouds' | 'stocks' | 'equityFunds' | 'fixedIncome' | 'gold';

export const ASSET_META: Record<AssetKey, { label: string; color: string; emoji: string }> = {
  cash: { label: 'الكاش', color: '#38bdf8', emoji: '💵' },
  clouds: { label: 'كلاودز', color: '#a78bfa', emoji: '☁️' },
  stocks: { label: 'الأسهم', color: '#34d399', emoji: '📈' },
  equityFunds: { label: 'صناديق', color: '#2dd4bf', emoji: '🧺' },
  fixedIncome: { label: 'دخل ثابت', color: '#f59e0b', emoji: '🏦' },
  gold: { label: 'الذهب', color: '#eab308', emoji: '🪙' },
};
export const ASSET_KEYS = Object.keys(ASSET_META) as AssetKey[];
export const UNCLASSIFIED = { label: 'غير مصنف', color: '#64748b' };

export type Breakdown = Partial<Record<AssetKey, number>>;

export interface VaultPortfolio {
  id: string;
  name: string;
  color: string;
  active: boolean;
  pinnedAsset?: AssetKey;
}

export interface VaultTag {
  label: string;
  emoji: string;
}

export interface VaultPartnerSettings {
  enabled: boolean;
  name: string;
  partnerCapital?: number; // رأس مال الشريك المرجعي المعتمد (مثلاً 570000)
  myCapital?: number; // أصل رأس مال المستخدم المرجعي (مثلاً 330000)
  profitShare?: number; // نسبة الشريك من الأرباح (افتراضياً 40)
}

export interface VaultSettings {
  portfolios: VaultPortfolio[];
  partner: VaultPartnerSettings;
  tags: { deposit: VaultTag[]; withdrawal: VaultTag[] };
  chartDirection?: 'rtl' | 'ltr'; // افتراضياً rtl
  bankRate?: number; // نسبة فائدة البنك المرجعية (افتراضياً 20%)
}

export interface VaultSnapshot {
  id: string; // `${portfolioId}_${date}`
  portfolioId: string;
  date: string; // YYYY-MM-DD
  total: number;
  breakdown?: Breakdown;
  note?: string;
  createdAt: number;
}

export interface VaultCashflow {
  id: string;
  portfolioId: string;
  type: 'deposit' | 'withdrawal' | 'dividend';
  amount: number; // always positive
  date: string;
  tag: string;
  emoji?: string;
  note?: string;
  opening?: boolean;
  partner?: boolean; // الحركة تخص الشريك (إيداع/سحب من رأس ماله)
  dividendMode?: 'reinvested' | 'withdrawn'; // للكوبونات: معاد استثماره داخل المحفظة أم مسحوب خارجها
  ticker?: string; // رمز السهم الموزّع للكوبون (مثل EGAL)
  createdAt: number;
}

export interface VaultMonthProfit {
  id: string; // YYYY-MM
  retainedMine: number;
  retainedPartner: number;
  distributedMine: number;
  distributedPartner: number;
  manualMine?: boolean; // إذا قام المستخدم بتعديل حصته يدوياً لهذا الشهر يتم احترام تعديله وعدم استبداله بالحساب التلقائي
  note?: string;
  updatedAt: number;
}

export const PORTFOLIO_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#eab308', '#06b6d4', '#ef4444'];

export const DEFAULT_SETTINGS: VaultSettings = {
  portfolios: [
    { id: 'thndr', name: 'ثاندر', color: '#f97316', active: true },
    { id: 'mubasher', name: 'مباشر', color: '#3b82f6', active: true },
    { id: 'hermes', name: 'هيرميس', color: '#10b981', active: true },
  ],
  partner: { enabled: false, name: 'الشريك', partnerCapital: 570000, myCapital: 330000, profitShare: 40 },
  tags: {
    deposit: [
      { label: 'زيادة رأس المال', emoji: '🚀' },
      { label: 'مضاربة مؤقتة', emoji: '⚡' },
      { label: 'تعزيز السيولة', emoji: '💧' },
      { label: 'مكافآت وإدخار', emoji: '🎁' },
      { label: 'استثمار شهري', emoji: '📅' },
    ],
    withdrawal: [
      { label: 'جني أرباح', emoji: '🎯' },
      { label: 'سداد الفيزا', emoji: '💳' },
      { label: 'سلفة', emoji: '🤝' },
      { label: 'أرباح الشريك', emoji: '👥' },
      { label: 'تخفيض رأس المال', emoji: '🔻' },
    ],
  },
  chartDirection: 'rtl',
  bankRate: 20,
};

