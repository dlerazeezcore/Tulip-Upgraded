import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/state/authStore';

type Identifier = 'phone' | 'email';

export function useSignIn() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { signInPassword } = useAuthStore();

  const [identifier, setIdentifier] = useState<Identifier>('phone');
  const [phone, setPhone] = useState(''); // E.164 from CountryPhoneField
  const [email, setEmail] = useState('');
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

  const onPasswordSignIn = () =>
    run(async () => {
      if (identifier === 'email') await signInPassword({ email: email.trim(), password });
      else await signInPassword({ phone, password });
      done();
    });

  const onChangeIdentifier = (v: string) => {
    setIdentifier(v as Identifier);
    setError(null);
  };

  return {
    // state
    identifier,
    phone,
    email,
    password,
    busy,
    error,
    // setters used by presentational fields
    setPhone,
    setEmail,
    setPassword,
    // segmented handler
    onChangeIdentifier,
    // actions
    onPasswordSignIn,
    // navigation
    goSignUp: () => router.replace(returnTo ? `/auth/sign-up?returnTo=${returnTo}` : '/auth/sign-up'),
  };
}
