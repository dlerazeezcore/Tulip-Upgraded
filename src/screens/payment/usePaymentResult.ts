// Wiring for the FIB return deep link (tulip://payment/result). The FIB app
// redirects here after the user finishes — or backs out of — paying. The charge
// itself is confirmed by the still-mounted payment sheet's poll on the checkout
// / top-up screen underneath (see useFibPayment.ts), NOT by this route. So this
// screen exists only to catch that deep link and bounce the user straight back
// to that in-progress sheet, instead of stranding them on Expo Router's
// "Unmatched Route" screen.
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export function usePaymentResult() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  // Warm start (the normal case): the deep link pushed this screen on top of
  // the still-mounted, still-polling payment sheet, so we can just pop back to
  // it. Cold start (the app was killed and re-launched by the deep link) has
  // nothing to return to — `canGoBack` is false and the UI renders a
  // <Redirect> to home instead. That path uses <Redirect> rather than an
  // imperative replace because it waits for the root navigator to be ready;
  // calling router.replace() from an effect on a cold boot throws
  // "navigate before mounting the Root Layout".
  const canGoBack = router.canGoBack();
  const popped = useRef(false);

  useEffect(() => {
    if (!canGoBack || popped.current) return;
    popped.current = true; // pop exactly once, never re-fire on re-render
    router.back();
  }, [canGoBack, router]);

  return { message: tr('checkout.fibReturning'), redirectHome: !canGoBack };
}
