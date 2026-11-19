import type { BoostPayFastCheckoutVariables } from '@/types/boost.type';

import { useState } from 'react';
import { showErrorToast } from '@/lib/errorToast';
import { startPayFastHandoff } from '@/lib/payfast';
import { useStartPayFastBoostCheckoutMutation } from '@/queries/clientBoost.query';

// Starts hosted PayFast checkout for a boost purchase and hands the seller over. `starting` stays
// true until the handoff settles. Resolves true once the checkout form is submitted.
export function useBoostPayFastHandoff(startFailureMessage: string) {
  const startPayFastBoost = useStartPayFastBoostCheckoutMutation();
  const [starting, setStarting] = useState(false);

  const startHandoff = async (variables: BoostPayFastCheckoutVariables) => {
    setStarting(true);
    try {
      return await startPayFastHandoff(
        () => startPayFastBoost.mutateAsync(variables),
        error => showErrorToast(error, startFailureMessage),
      );
    } finally {
      setStarting(false);
    }
  };

  return { starting, startHandoff };
}
