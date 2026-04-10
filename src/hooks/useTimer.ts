"use client";

import { useRef, useCallback, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import type { GameEvent } from "@/types/realtime";

interface UseTimerOptions {
  send: (event: GameEvent) => Promise<void>;
  onExpired?: () => void;
}

export function useTimer({ send, onExpired }: UseTimerOptions) {
  const store = useGameStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clearTimer();
      store.setTimer(seconds, true);

      let remaining = seconds;
      intervalRef.current = setInterval(async () => {
        remaining--;
        store.setTimer(remaining, remaining > 0);

        await send({
          type: "TIMER_TICK",
          payload: { remaining },
        });

        if (remaining <= 0) {
          clearTimer();
          onExpiredRef.current?.();
        }
      }, 1000);
    },
    [clearTimer, send, store]
  );

  const pause = useCallback(() => {
    clearTimer();
    store.setTimer(store.timerRemaining, false);
  }, [clearTimer, store]);

  const resume = useCallback(() => {
    const remaining = store.timerRemaining;
    if (remaining && remaining > 0) {
      start(remaining);
    }
  }, [start, store.timerRemaining]);

  const reset = useCallback(
    (seconds: number) => {
      clearTimer();
      store.setTimer(seconds, false);
    },
    [clearTimer, store]
  );

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { start, pause, resume, reset };
}
