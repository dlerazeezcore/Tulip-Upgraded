import React from 'react';
import { useRouter } from 'expo-router';
import { useEsimStore } from '@/state/esimStore';

export function useEsimHistory() {
  const router = useRouter();
  const history = useEsimStore((s) => s.history);
  const loading = useEsimStore((s) => s.historyLoading);
  const refreshHistory = useEsimStore((s) => s.refreshHistory);

  React.useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/manage/esim'));
  const goEsim = (id: string) => router.push(`/esim/${id}`);

  return {
    history,
    loading,
    refreshHistory,
    goBack,
    goEsim,
  };
}
