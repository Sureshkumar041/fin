'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** A short-lived success message, e.g. "Category added." (clears itself after 4s). */
export function useNotice(durationMs = 4000) {
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showNotice = useCallback(
    (message: string) => {
      setNotice(message);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setNotice(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { notice, showNotice };
}
