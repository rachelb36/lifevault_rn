import { useCallback, useMemo, useRef, useState } from "react";

type Options = {
  tapsToUnlock?: number; // default 7
  timeoutMs?: number;    // reset if user pauses (default 1500ms)
};

export function useDevEasterEgg(options: Options = {}) {
  const tapsToUnlock = options.tapsToUnlock ?? 7;
  const timeoutMs = options.timeoutMs ?? 1500;

  const [unlocked, setUnlocked] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const lastTapMsRef = useRef<number>(0);

  const onTap = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastTapMsRef.current;
    lastTapMsRef.current = now;

    // If user pauses too long, start over
    setTapCount((prev) => {
      const next = elapsed > timeoutMs ? 1 : prev + 1;

      if (next >= tapsToUnlock) {
        setUnlocked(true);
        return 0; // reset after unlock
      }

      return next;
    });
  }, [tapsToUnlock, timeoutMs]);

  const hint = useMemo(() => {
    if (unlocked) return null;
    // Optional: very subtle hint, or return null to keep it silent
    // return tapCount > 0 ? `${tapsToUnlock - tapCount} more…` : null;
    return null;
  }, [tapCount, tapsToUnlock, unlocked]);

  return { unlocked, onTap, hint };
}