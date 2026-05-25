import React from 'react';
import { Redirect } from 'expo-router';
import { useLocaleStore } from '@/state/localeStore';

export default function Index() {
  const onboarded = useLocaleStore((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
