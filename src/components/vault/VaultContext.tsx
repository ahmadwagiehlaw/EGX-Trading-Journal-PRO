import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { VaultSettings, VaultSnapshot, VaultCashflow, VaultMonthProfit } from './types';
import { DEFAULT_SETTINGS } from './types';

interface Ctx {
  loading: boolean;
  settings: VaultSettings;
  snapshots: VaultSnapshot[];
  cashflows: VaultCashflow[];
  months: VaultMonthProfit[];
  saveSettings: (s: VaultSettings) => Promise<void>;
  saveSnapshot: (s: Omit<VaultSnapshot, 'id' | 'createdAt'>) => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;
  addCashflow: (c: Omit<VaultCashflow, 'id' | 'createdAt'>) => Promise<void>;
  deleteCashflow: (id: string) => Promise<void>;
  updateCashflow: (id: string, patch: Partial<VaultCashflow>) => Promise<void>;
  renameTag: (type: 'deposit' | 'withdrawal', from: string, to: string) => Promise<void>;
  saveMonth: (m: Omit<VaultMonthProfit, 'updatedAt'>) => Promise<void>;
  deleteMonth: (id: string) => Promise<void>;
  resetAllVaultData: () => Promise<void>;
}

const VaultCtx = createContext<Ctx | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VaultSettings>(DEFAULT_SETTINGS);
  const [snapshots, setSnapshots] = useState<VaultSnapshot[]>([]);
  const [cashflows, setCashflows] = useState<VaultCashflow[]>([]);
  const [months, setMonths] = useState<VaultMonthProfit[]>([]);
  const [ready, setReady] = useState({ s: false, a: false, c: false, m: false });

  useEffect(() => {
    const u1 = onSnapshot(doc(db, 'vault_settings', 'main'), d => {
      if (d.exists()) {
        const v = d.data() as Partial<VaultSettings>;
        setSettings({
          portfolios: v.portfolios?.length ? v.portfolios : DEFAULT_SETTINGS.portfolios,
          partner: { ...DEFAULT_SETTINGS.partner, ...(v.partner ?? {}) },
          tags: { deposit: v.tags?.deposit ?? DEFAULT_SETTINGS.tags.deposit, withdrawal: v.tags?.withdrawal ?? DEFAULT_SETTINGS.tags.withdrawal },
          chartDirection: v.chartDirection ?? 'rtl',
        });
      }
      setReady(r => ({ ...r, s: true }));
    }, () => setReady(r => ({ ...r, s: true })));
    const u2 = onSnapshot(collection(db, 'vault_snapshots'), q => {
      setSnapshots(q.docs.map(d => ({ ...d.data(), id: d.id } as VaultSnapshot)));
      setReady(r => ({ ...r, a: true }));
    }, () => setReady(r => ({ ...r, a: true })));
    const u3 = onSnapshot(collection(db, 'vault_cashflow'), q => {
      setCashflows(q.docs.map(d => ({ ...d.data(), id: d.id } as VaultCashflow)));
      setReady(r => ({ ...r, c: true }));
    }, () => setReady(r => ({ ...r, c: true })));
    const u4 = onSnapshot(collection(db, 'vault_months'), q => {
      setMonths(q.docs.map(d => ({ ...d.data(), id: d.id } as VaultMonthProfit)).sort((a, b) => a.id.localeCompare(b.id)));
      setReady(r => ({ ...r, m: true }));
    }, () => setReady(r => ({ ...r, m: true })));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const value = useMemo<Ctx>(() => ({
    loading: !(ready.s && ready.a && ready.c && ready.m),
    settings,
    snapshots,
    cashflows,
    months,
    saveSettings: s => setDoc(doc(db, 'vault_settings', 'main'), JSON.parse(JSON.stringify(s))),
    saveSnapshot: async s => {
      const id = `${s.portfolioId}_${s.date}`;
      await setDoc(doc(db, 'vault_snapshots', id), JSON.parse(JSON.stringify({ ...s, id, createdAt: Date.now() })));
    },
    deleteSnapshot: id => deleteDoc(doc(db, 'vault_snapshots', id)),
    addCashflow: async c => {
      const id = `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'vault_cashflow', id), JSON.parse(JSON.stringify({ ...c, id, createdAt: Date.now() })));
    },
    deleteCashflow: id => deleteDoc(doc(db, 'vault_cashflow', id)),
    updateCashflow: async (id, patch) => {
      await setDoc(doc(db, 'vault_cashflow', id), JSON.parse(JSON.stringify(patch)), { merge: true });
    },
    renameTag: async (type, from, to) => {
      const nt = { ...settings.tags, [type]: settings.tags[type].map(t => (t.label === from ? { ...t, label: to } : t)) };
      await setDoc(doc(db, 'vault_settings', 'main'), JSON.parse(JSON.stringify({ ...settings, tags: nt })));
      for (const c of cashflows.filter(x => x.type === type && x.tag === from)) await setDoc(doc(db, 'vault_cashflow', c.id), { tag: to }, { merge: true });
    },
    saveMonth: async m => {
      await setDoc(doc(db, 'vault_months', m.id), JSON.parse(JSON.stringify({ ...m, updatedAt: Date.now() })));
    },
    deleteMonth: id => deleteDoc(doc(db, 'vault_months', id)),
    resetAllVaultData: async () => {
      // Delete all snapshots
      for (const s of snapshots) {
        await deleteDoc(doc(db, 'vault_snapshots', s.id));
      }
      // Delete all cashflows
      for (const c of cashflows) {
        await deleteDoc(doc(db, 'vault_cashflow', c.id));
      }
      // Delete all months
      for (const m of months) {
        await deleteDoc(doc(db, 'vault_months', m.id));
      }
    },
  }), [ready, settings, snapshots, cashflows, months]);

  return <VaultCtx.Provider value={value}>{children}</VaultCtx.Provider>;
}

export function useVault() {
  const c = useContext(VaultCtx);
  if (!c) throw new Error('useVault must be used inside VaultProvider');
  return c;
}

