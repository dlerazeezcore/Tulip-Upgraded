import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/state/authStore';
import { useCurrencyStore } from '@/state/currencyStore';
import { getCurrencies } from '@/services/currency';
import { cachedCountries, queryPackages } from '@/services/esim';
import {
  getPricingRules,
  getDiscountRules,
  savePricingRule,
  saveDiscountRule,
  removePricingRule,
  removeDiscountRule,
  type AdminPricingRule,
  type AdminDiscountRule,
  type RuleScope,
  type AdjustmentType,
} from '@/services/admin';

export type RuleKind = 'markup' | 'discount';

export type RuleDraft = {
  kind: RuleKind;
  scope: RuleScope; // markup: country|package ; discount: global|country|package
  countryCode: string;
  packageCode: string;
  packageLabel: string; // friendly bundle label (e.g. "Turkey 5GB 30Days")
  slug: string;
  type: AdjustmentType;
  value: string;
  isNew: boolean;
};

export type BundleOption = { packageCode: string; label: string; slug: string };

function bundleLabel(p: { name?: string; volume?: number; duration?: number; packageCode: string }): string {
  if (p.name) return p.name;
  const gb = p.volume && p.volume > 0 ? `${Math.round((p.volume / 1024 ** 3) * 10) / 10}GB` : '';
  const days = p.duration ? `${p.duration}d` : '';
  return [gb, days].filter(Boolean).join(' · ') || p.packageCode;
}

export function usePricing() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => !!s.user?.isAdmin);
  const loadExchange = useCurrencyStore((s) => s.loadExchange);

  const [generalMarkup, setGeneralMarkup] = useState(0);
  const [pricing, setPricing] = useState<AdminPricingRule[]>([]);
  const [discounts, setDiscounts] = useState<AdminDiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<RuleDraft | null>(null);
  const [bundleCountry, setBundleCountry] = useState('');
  const [bundles, setBundles] = useState<BundleOption[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(false);

  const loadBundles = useCallback(async (country: string) => {
    const code = country.trim().toUpperCase().slice(0, 2);
    setBundleCountry(code);
    if (code.length !== 2) {
      setBundles([]);
      return;
    }
    setBundlesLoading(true);
    try {
      const pkgs = await queryPackages({ locationCode: code });
      setBundles(pkgs.map((p) => ({ packageCode: p.packageCode, slug: p.slug || '', label: bundleLabel(p) })));
    } catch {
      setBundles([]);
    } finally {
      setBundlesLoading(false);
    }
  }, []);

  const resetPicker = () => {
    setBundleCountry('');
    setBundles([]);
  };

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [cur, pr, dr] = await Promise.all([getCurrencies(), getPricingRules(), getDiscountRules()]);
      setGeneralMarkup(Number(cur.esimPricing?.markupPercent) || 0);
      setPricing(pr.filter((r) => r.active));
      setDiscounts(dr.filter((r) => r.active));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void reload();
  }, [isAdmin, reload]);

  // Markup section shows only the per-country / per-bundle overrides (the general
  // markup is the global rule, edited on the Exchange-rates screen).
  const markupOverrides = pricing.filter((r) => r.rule_scope !== 'global');

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await fn();
      await loadExchange();
      await reload();
      setEditing(null);
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const onSave = () =>
    run(async () => {
      if (!editing) return;
      const value = parseFloat(editing.value);
      if (!Number.isFinite(value)) throw new Error('Enter a numeric value');
      if (editing.scope === 'country' && !editing.countryCode.trim()) throw new Error('Country code is required');
      if (editing.scope === 'package' && !editing.packageCode.trim()) throw new Error('Pick a bundle');
      const input = {
        ruleScope: editing.scope,
        countryCode: editing.countryCode,
        packageCode: editing.packageCode,
        type: editing.type,
        value,
        customFields:
          editing.scope === 'package'
            ? { label: editing.packageLabel || editing.packageCode, slug: editing.slug }
            : undefined,
      };
      if (editing.kind === 'markup') await savePricingRule(input);
      else await saveDiscountRule(input);
    });

  return {
    isAdmin,
    loading,
    busy,
    error,
    saved,
    generalMarkup,
    markupOverrides,
    discounts,
    editing,
    countryName: (code: string | null) => {
      if (!code) return '';
      return cachedCountries().find((x) => x.code === code.toUpperCase())?.name || code;
    },
    bundleCountry,
    bundles,
    bundlesLoading,
    loadBundles,
    pickBundle: (b: BundleOption) => setEditing((d) => (d ? { ...d, packageCode: b.packageCode, packageLabel: b.label, slug: b.slug } : d)),
    openAddMarkup: () => {
      resetPicker();
      setEditing({ kind: 'markup', scope: 'country', countryCode: '', packageCode: '', packageLabel: '', slug: '', type: 'percent', value: '', isNew: true });
    },
    openAddDiscount: () => {
      resetPicker();
      setEditing({ kind: 'discount', scope: 'country', countryCode: '', packageCode: '', packageLabel: '', slug: '', type: 'percent', value: '', isNew: true });
    },
    openEditMarkup: (r: AdminPricingRule) =>
      setEditing({ kind: 'markup', scope: r.rule_scope, countryCode: r.country_code || '', packageCode: r.package_code || '', packageLabel: r.custom_fields?.label || r.package_code || '', slug: r.custom_fields?.slug || '', type: r.adjustment_type, value: String(r.adjustment_value), isNew: false }),
    openEditDiscount: (r: AdminDiscountRule) =>
      setEditing({ kind: 'discount', scope: r.rule_scope, countryCode: r.country_code || '', packageCode: r.package_code || '', packageLabel: r.custom_fields?.label || r.package_code || '', slug: r.custom_fields?.slug || '', type: r.discount_type, value: String(r.discount_value), isNew: false }),
    patchDraft: (patch: Partial<RuleDraft>) => setEditing((d) => (d ? { ...d, ...patch } : d)),
    closeEditor: () => setEditing(null),
    onSave,
    onRemoveMarkup: (r: AdminPricingRule) => run(() => removePricingRule(r)),
    onRemoveDiscount: (r: AdminDiscountRule) => run(() => removeDiscountRule(r)),
    goBack: () => (router.canGoBack() ? router.back() : router.replace('/admin')),
    reload,
  };
}
