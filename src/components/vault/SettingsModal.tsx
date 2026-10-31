import { useState } from 'react';
import { Plus, Trash2, EyeOff, Eye, Landmark, Users, ArrowUp, ArrowDown, AlertOctagon } from 'lucide-react';
import { Modal, Field, inputCls, Segmented, cx } from './ui';
import { useVault } from './VaultContext';
import { PORTFOLIO_COLORS } from './types';
import type { VaultCashflow } from './types';
import { todayStr, fmt } from './calc';

type Tab = 'portfolios' | 'capital' | 'partner' | 'tags' | 'danger';

function TagChip({ label, emoji, onRename, onRemove }: { label: string; emoji: string; onRename: (to: string) => void; onRemove: () => void }) {
  const [v, setV] = useState(label);
  return (
    <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-200">
      {emoji}
      <input
        value={v}
        size={Math.max(4, v.length)}
        onChange={e => setV(e.target.value)}
        onBlur={() => { const t = v.trim(); if (t && t !== label) onRename(t); else setV(label); }}
        className="bg-transparent outline-none focus:text-orange-500"
      />
      <button onClick={onRemove} className="text-slate-300 hover:text-rose-500">×</button>
    </span>
  );
}

function FlowEditRow({ c, name, onUpdate, onDelete }: { c: VaultCashflow; name?: string; onUpdate: (p: Partial<VaultCashflow>) => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold">
      <input type="date" defaultValue={c.date} key={c.id + c.date} onBlur={e => e.target.value && e.target.value !== c.date && onUpdate({ date: e.target.value })} className={cx(inputCls, '!w-auto !py-1.5')} />
      <span className="w-16 shrink-0 truncate text-slate-500">{name}</span>
      <span className={c.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}>{c.type === 'deposit' ? '+' : '−'}</span>
      <input inputMode="decimal" dir="ltr" defaultValue={c.amount} key={c.id + c.amount} onBlur={e => { const n = parseFloat(e.target.value); if (n > 0 && n !== c.amount) onUpdate({ amount: n }); }} className={cx(inputCls, '!py-1.5 text-left tabular-nums')} />
      <button onClick={onDelete} className="p-1.5 text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, saveSettings, cashflows, snapshots, months, addCashflow, updateCashflow, deleteCashflow, renameTag, resetAllVaultData } = useVault();
  const [tab, setTab] = useState<Tab>('portfolios');
  const [newName, setNewName] = useState('');
  const [openAmt, setOpenAmt] = useState<Record<string, string>>({});
  const [openDateState, setOpenDate] = useState<string | null>(null);
  const [tagType, setTagType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [tagLabel, setTagLabel] = useState('');
  const [tagEmoji, setTagEmoji] = useState('🏷️');
  const [pf, setPf] = useState({ date: todayStr(), pid: '', amount: '', type: 'deposit' as 'deposit' | 'withdrawal' });
  const [confirmResetText, setConfirmResetText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const upd = (patch: Partial<typeof settings>) => saveSettings({ ...settings, ...patch });
  const hasData = (id: string) => cashflows.some(c => c.portfolioId === id) || snapshots.some(s => s.portfolioId === id);
  const active = settings.portfolios.filter(p => p.active);
  const pname = (id: string) => settings.portfolios.find(p => p.id === id)?.name;

  const movePortfolio = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= settings.portfolios.length) return;
    const next = [...settings.portfolios];
    const item = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = item;
    upd({ portfolios: next });
  };

  const addPortfolio = () => {
    const name = newName.trim();
    if (!name) return;
    const id = `p_${Date.now().toString(36)}`;
    upd({ portfolios: [...settings.portfolios, { id, name, color: PORTFOLIO_COLORS[settings.portfolios.length % PORTFOLIO_COLORS.length], active: true }] });
    setNewName('');
  };

  /* ── رأس المال الأساسي ── */
  const openings = cashflows.filter(c => c.opening);
  const openingOf = (id: string) => openings.find(o => o.portfolioId === id);
  const valueOf = (id: string) => openAmt[id] ?? (openingOf(id) ? String(openingOf(id)!.amount) : '');
  const openDate = openDateState ?? openings[0]?.date ?? todayStr();
  const totalCapital = active.reduce((a, p) => a + (parseFloat(valueOf(p.id)) || 0), 0);
  const dirty = (id: string) => {
    const n = parseFloat(valueOf(id));
    const ex = openingOf(id);
    return n > 0 && (!ex || ex.amount !== n || ex.date !== openDate);
  };
  const saveOpening = async (id: string) => {
    const n = parseFloat(valueOf(id));
    if (!(n > 0)) return;
    const ex = openingOf(id);
    if (ex) await updateCashflow(ex.id, { amount: n, date: openDate });
    else await addCashflow({ portfolioId: id, type: 'deposit', amount: n, date: openDate, tag: 'رأس المال الأساسي', emoji: '🏛️', opening: true });
    setOpenAmt(o => { const c = { ...o }; delete c[id]; return c; });
  };

  /* ── الشريك ── */
  const partnerFlows = cashflows.filter(c => c.partner).sort((a, b) => a.date.localeCompare(b.date));
  const partnerNet = partnerFlows.reduce((a, c) => a + (c.type === 'deposit' ? c.amount : -c.amount), 0);
  const pfPid = pf.pid || active[0]?.id || '';

  return (
    <Modal open={open} onClose={onClose} title="إعدادات الخزنة" wide>
      <div className="space-y-5">
        <Segmented value={tab} onChange={setTab} options={[
          { v: 'portfolios', label: 'المحافظ' }, { v: 'capital', label: 'رأس المال الأساسي' }, { v: 'partner', label: 'الشريك' }, { v: 'tags', label: 'التصنيفات' }, { v: 'danger', label: 'إعادة ضبط الخزنة' }
        ]} />

        {tab === 'portfolios' && (
          <div className="space-y-2.5">
            {settings.portfolios.map((p, i) => (
              <div key={p.id} className={cx('flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-3', !p.active && 'opacity-50')}>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    title="تحريك لأعلى"
                    disabled={i === 0}
                    onClick={() => movePortfolio(i, 'up')}
                    className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="تحريك لأسفل"
                    disabled={i === settings.portfolios.length - 1}
                    onClick={() => movePortfolio(i, 'down')}
                    className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input type="color" value={p.color} onChange={e => upd({ portfolios: settings.portfolios.map(x => x.id === p.id ? { ...x, color: e.target.value } : x) })} className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer shrink-0" />
                <input value={p.name} onChange={e => upd({ portfolios: settings.portfolios.map(x => x.id === p.id ? { ...x, name: e.target.value } : x) })} className={cx(inputCls, '!py-2 flex-1')} />
                <button title={p.active ? 'إخفاء' : 'إظهار'} onClick={() => upd({ portfolios: settings.portfolios.map(x => x.id === p.id ? { ...x, active: !x.active } : x) })} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                  {p.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  title={hasData(p.id) ? 'عليها بيانات — اخفيها بدل الحذف' : 'حذف'}
                  disabled={hasData(p.id) || settings.portfolios.length <= 1}
                  onClick={() => upd({ portfolios: settings.portfolios.filter((_, j) => j !== i) })}
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 disabled:opacity-25 disabled:cursor-not-allowed shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPortfolio()} placeholder="اسم محفظة جديدة" className={inputCls} />
              <button onClick={addPortfolio} className="shrink-0 flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 text-xs font-black"><Plus className="w-4 h-4" />إضافة</button>
            </div>
            <p className="text-[11px] font-bold text-slate-400">الأسماء والألوان تتعدل في أي وقت وتتغير في كل الصفحة فوراً.</p>
          </div>
        )}

        {tab === 'capital' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-l from-slate-900 to-indigo-950 px-5 py-4 text-white">
              <span className="text-xs font-bold text-slate-300">إجمالي رأس المال الأساسي</span>
              <span dir="ltr" className="text-2xl font-black tabular-nums">{fmt(totalCapital)}</span>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-6">سجّل رأس المال الأساسي لكل محفظة كإيداع افتتاحي، وتقدر تعدّله في أي وقت. هو أصل الإيداعات اللي كل العوائد بتتحسب عليه.</p>
            <Field label="تاريخ الافتتاح"><input type="date" value={openDate} max={todayStr()} onChange={e => setOpenDate(e.target.value)} className={inputCls} /></Field>
            {active.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <i className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="w-20 text-sm font-black text-slate-700 dark:text-slate-200">{p.name}</span>
                <input inputMode="decimal" dir="ltr" value={valueOf(p.id)} onChange={e => setOpenAmt(o => ({ ...o, [p.id]: e.target.value }))} placeholder="0" className={cx(inputCls, 'text-left tabular-nums')} />
                <button disabled={!dirty(p.id)} onClick={() => saveOpening(p.id)} className={cx('shrink-0 rounded-xl px-4 py-2.5 text-xs font-black text-white disabled:opacity-30', openingOf(p.id) ? 'bg-indigo-500' : 'bg-emerald-500')}>{openingOf(p.id) ? 'تحديث' : 'تسجيل'}</button>
                {openingOf(p.id) && <button title="حذف" onClick={() => deleteCashflow(openingOf(p.id)!.id)} className="shrink-0 text-rose-400"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <button disabled={!active.some(p => dirty(p.id))} onClick={async () => { for (const p of active) if (dirty(p.id)) await saveOpening(p.id); }} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 disabled:opacity-30"><Landmark className="w-4 h-4" />حفظ الكل</button>
          </div>
        )}

        {tab === 'partner' && (
          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 p-4 cursor-pointer">
              <span className="text-sm font-black text-slate-800 dark:text-slate-100">تفعيل عرض الشريك</span>
              <input type="checkbox" checked={settings.partner.enabled} onChange={e => upd({ partner: { ...settings.partner, enabled: e.target.checked } })} className="w-5 h-5 accent-orange-500" />
            </label>
            <Field label="اسم الشريك"><input value={settings.partner.name} onChange={e => upd({ partner: { ...settings.partner, name: e.target.value } })} className={inputCls} /></Field>

            <div className="rounded-2xl bg-violet-500/5 border border-violet-500/20 p-4 text-[11px] font-bold leading-6 text-violet-700 dark:text-violet-300">
              فلوس الشريك بتتسجل كإيداع فعلي في المحفظة (بتدخل في صافي الإيداعات) ومعلّمة "شريك". الحساب بالوحدات من تاريخ دخوله بالظبط: الأرباح اللي قبل دخوله ليك لوحدك، وبعدها بنفس نسب العوائد. تقدر تضيف أكتر من دفعة بتواريخ مختلفة.
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-black text-slate-500"><Users className="w-4 h-4" />صافي رأس مال الشريك</span>
              <span dir="ltr" className="text-lg font-black tabular-nums">{fmt(partnerNet)}</span>
            </div>

            <div className="space-y-2">
              {partnerFlows.length === 0 && <p className="text-center text-xs font-bold text-slate-400 py-2">لا توجد دفعات للشريك</p>}
              {partnerFlows.map(c => (
                <FlowEditRow key={c.id} c={c} name={pname(c.portfolioId)} onUpdate={p => updateCashflow(c.id, p)} onDelete={() => deleteCashflow(c.id)} />
              ))}
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3 space-y-3">
              <div className="text-[11px] font-black text-slate-500">إضافة دفعة</div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={pf.date} max={todayStr()} onChange={e => setPf(s => ({ ...s, date: e.target.value }))} className={inputCls} />
                <select value={pfPid} onChange={e => setPf(s => ({ ...s, pid: e.target.value }))} className={inputCls}>
                  {active.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <Segmented value={pf.type} onChange={t => setPf(s => ({ ...s, type: t }))} options={[{ v: 'deposit', label: 'إيداع' }, { v: 'withdrawal', label: 'سحب' }]} />
                <input inputMode="decimal" dir="ltr" value={pf.amount} onChange={e => setPf(s => ({ ...s, amount: e.target.value }))} placeholder="المبلغ" className={cx(inputCls, 'text-left tabular-nums')} />
                <button
                  disabled={!(parseFloat(pf.amount) > 0) || !pfPid}
                  onClick={async () => {
                    await addCashflow({ portfolioId: pfPid, type: pf.type, amount: parseFloat(pf.amount), date: pf.date, tag: 'رأس مال الشريك', emoji: '👥', partner: true });
                    setPf(s => ({ ...s, amount: '' }));
                  }}
                  className="shrink-0 rounded-xl bg-violet-500 px-5 text-xs font-black text-white disabled:opacity-30">إضافة</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'tags' && (
          <div className="space-y-4">
            <Segmented value={tagType} onChange={setTagType} options={[{ v: 'deposit', label: 'الإيداع' }, { v: 'withdrawal', label: 'السحب' }]} />
            <div className="flex flex-wrap gap-2">
              {settings.tags[tagType].map(t => (
                <TagChip
                  key={tagType + t.label}
                  label={t.label}
                  emoji={t.emoji}
                  onRename={to => !settings.tags[tagType].some(x => x.label === to) && renameTag(tagType, t.label, to)}
                  onRemove={() => upd({ tags: { ...settings.tags, [tagType]: settings.tags[tagType].filter(x => x.label !== t.label) } })}
                />
              ))}
            </div>
            <p className="text-[11px] font-bold text-slate-400">اضغط على الاسم لتعديله — التعديل بيتطبق على الحركات القديمة كمان.</p>
            <div className="flex gap-2">
              <input value={tagEmoji} onChange={e => setTagEmoji(e.target.value)} className={cx(inputCls, '!w-16 text-center')} />
              <input value={tagLabel} onChange={e => setTagLabel(e.target.value)} placeholder="تصنيف جديد" className={inputCls} />
              <button
                onClick={() => { const l = tagLabel.trim(); if (!l) return; upd({ tags: { ...settings.tags, [tagType]: [...settings.tags[tagType], { label: l, emoji: tagEmoji || '🏷️' }] } }); setTagLabel(''); }}
                className="shrink-0 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 text-xs font-black">إضافة</button>
            </div>
          </div>
        )}

        {tab === 'danger' && (
          <div className="space-y-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <span>منطقة الخطر: حذف كافة بيانات الخزنة والبدء من جديد</span>
            </div>
            <p className="text-xs font-bold leading-6 text-slate-600 dark:text-slate-300">
              هذا الإجراء سيقوم بحذف <b>جميع</b> القيم السوقية المسجلة، والحركات النقدية (الإيداعات والسحوبات)، والأرباح الشهرية من الخزنة نهائياً، لتبدأ من جديد بسجل نظيف تماماً من التاريخ الذي تختاره (مثلاً من شهر فات).
              <br />
              <span className="text-slate-400 text-[11px]">(ملاحظة: صفقات الأسهم في سجل التداول لن تتأثر إطلاقاً، الحذف خاص ببيانات الخزنة فقط).</span>
            </p>

            <div className="rounded-xl bg-white dark:bg-slate-900 p-3 text-xs font-bold text-slate-500 space-y-1">
              <div>• عدد القيم السوقية التي ستُحذف: <b className="text-rose-500">{snapshots.length}</b></div>
              <div>• عدد الحركات النقدية التي ستُحذف: <b className="text-rose-500">{cashflows.length}</b></div>
              <div>• عدد سجلات الأرباح الشهرية: <b className="text-rose-500">{months.length}</b></div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400">
                لتأكيد الحذف النهائي، اكتب كلمة <b className="text-rose-600 select-all font-mono">مسح</b> في الخانة أدناه:
              </label>
              <input
                value={confirmResetText}
                onChange={e => setConfirmResetText(e.target.value)}
                placeholder="اكتب كلمة مسح هنا"
                className={cx(inputCls, 'border-rose-300 dark:border-rose-800 text-center font-black')}
              />
            </div>

            <button
              disabled={confirmResetText.trim() !== 'مسح' || isResetting}
              onClick={async () => {
                setIsResetting(true);
                try {
                  await resetAllVaultData();
                  setConfirmResetText('');
                  onClose();
                } finally {
                  setIsResetting(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 py-3 text-sm font-black text-white shadow-lg shadow-rose-600/25 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <Trash2 className="w-4 h-4" />
              {isResetting ? 'جاري حذف بيانات الخزنة...' : 'تأكيد الحذف الشامل والبدء من جديد'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
