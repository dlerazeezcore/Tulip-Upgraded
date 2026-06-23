import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import { useCurrencyStore } from '@/state/currencyStore';
import { getCurrencies } from '@/services/currency';
import { saveCurrencyRate, saveEsimMarkup } from '@/services/admin';
import { usdToIqd } from '@/lib/pricing';
import type { CurrencyMeta } from '@/data/currency';

export type CurrencyDraft = {
  code: string;
  name: string;
  symbol: string;
  decimals: string;
  position: 'prefix' | 'suffix';
  flag: string;
  rate: string; // IQD per 1 unit
  enabled: boolean;
  isNew: boolean;
};

export type AdminCurrencyViewModel = {
  isAdmin: boolean;
  loading: boolean;
  busy: boolean;
  error: string | null;
  saved: boolean;
  /** Foreign display currencies (IQD base is implicit at rate 1). */
  rows: CurrencyMeta[];
  usdRate: number;
  markup: string;
  preview: number;
  onChangeMarkup: (v: string) => void;
  onSaveMarkup: () => Promise<void>;
  editing: CurrencyDraft | null;
  openNew: () => void;
  openEdit: (c: CurrencyMeta) => void;
  closeEditor: () => void;
  patchDraft: (patch: Partial<CurrencyDraft>) => void;
  onSaveCurrency: () => Promise<void>;
  toggleEnabled: (c: CurrencyMeta) => Promise<void>;
  goBack: () => void;
  reload: () => Promise<void>;
};

const EMPTY_DRAFT: CurrencyDraft = {
  code: '', name: '', symbol: '', decimals: '2', position: 'prefix', flag: '', rate: '', enabled: true, isNew: true,
};

export function useAdminCurrency(): AdminCurrencyViewModel {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const loadExchange = useCurrencyStore((s) => s.loadExchange);

  const [all, setAll] = useState<CurrencyMeta[]>([]);
  const [markup, setMarkup] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CurrencyDraft | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCurrencies();
      setAll((res.currencies ?? []).filter((c) => c && c.code));
      setMarkup(String(res.esimPricing?.markupPercent ?? '0'));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load currencies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void reload();
  }, [isAdmin, reload]);

  // The exchange rate is universal currency conversion; IQD is the base (rate 1).
  const rows = all.filter((c) => c.code !== 'IQD');
  const usdRate = all.find((c) => c.code === 'USD')?.rate ?? 0;
  const markupNum = parseFloat(markup) || 0;
  const preview = usdToIqd(1, usdRate * (1 + markupNum / 100)); // $1 provider → IQD sale price

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await fn();
      await loadExchange();
      await reload();
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const onSaveMarkup = () => run(() => saveEsimMarkup(markupNum));

  const onSaveCurrency = () =>
    run(async () => {
      if (!editing) return;
      const code = editing.code.trim().toUpperCase();
      const rate = parseFloat(editing.rate);
      if (!code) throw new Error('Currency code is required');
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Rate must be a positive number');
      await saveCurrencyRate({
        code,
        rate,
        symbol: editing.symbol.trim() || code,
        name: editing.name.trim() || code,
        decimals: Math.max(parseInt(editing.decimals, 10) || 0, 0),
        position: editing.position,
        flag: editing.flag.trim().toUpperCase() || code.slice(0, 2),
        enabled: editing.enabled,
      });
      setEditing(null);
    });

  const toggleEnabled = (c: CurrencyMeta) =>
    run(() =>
      saveCurrencyRate({
        code: c.code,
        rate: c.rate,
        symbol: c.symbol,
        name: c.name,
        decimals: c.decimals,
        position: c.position,
        flag: c.flag,
        enabled: !c.enabled,
      }),
    );

  return {
    isAdmin,
    loading,
    busy,
    error,
    saved,
    rows,
    usdRate,
    markup,
    preview,
    onChangeMarkup: (v) => { setMarkup(v.replace(/[^\d.]/g, '')); setSaved(false); },
    onSaveMarkup,
    editing,
    openNew: () => setEditing({ ...EMPTY_DRAFT }),
    openEdit: (c) =>
      setEditing({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        decimals: String(c.decimals),
        position: c.position,
        flag: c.flag,
        rate: String(c.rate),
        enabled: c.enabled,
        isNew: false,
      }),
    closeEditor: () => setEditing(null),
    patchDraft: (patch) => setEditing((d) => (d ? { ...d, ...patch } : d)),
    onSaveCurrency,
    toggleEnabled,
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
    reload,
  };
}
