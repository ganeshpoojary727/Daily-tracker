import { useState, useEffect } from 'react';
import { calculateCountdown, CountdownResult } from '../lib/dateUtils';

export function useCountdown(endDateISO: string): CountdownResult {
  const [countdown, setCountdown] = useState<CountdownResult>(() => calculateCountdown(endDateISO));

  useEffect(() => {
    // Initial check
    setCountdown(calculateCountdown(endDateISO));

    const timer = setInterval(() => {
      const updated = calculateCountdown(endDateISO);
      setCountdown(updated);

      if (updated.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDateISO]);

  return countdown;
}
