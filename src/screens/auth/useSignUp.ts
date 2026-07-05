import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';

export function useSignUp() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signUp } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    if (returnTo === 'checkout') router.replace('/esim-store/checkout');
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || tr('common.somethingWrong'));
    } finally {
      setBusy(false);
    }
  };

  const onPasswordSignUp = () =>
    run(async () => {
      await signUp({ phone, name, password });
      done();
    });

  return {
    // state
    name,
    phone,
    password,
    busy,
    error,
    // setters used by presentational fields
    setName,
    setPhone,
    setPassword,
    // actions
    onPasswordSignUp,
    // navigation
    goSignIn: () => router.replace(returnTo ? `/auth/sign-in?returnTo=${returnTo}` : '/auth/sign-in'),
  };
}
