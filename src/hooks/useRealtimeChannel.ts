"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GameEvent, TeamEvent } from "@/types/realtime";

type AnyEvent = GameEvent | TeamEvent;

interface UseRealtimeChannelOptions {
  channelName: string;
  onMessage: (event: AnyEvent) => void;
  onReconnect?: () => void;
  enabled?: boolean;
}

export function useRealtimeChannel({
  channelName,
  onMessage,
  onReconnect,
  enabled = true,
}: UseRealtimeChannelOptions) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  const onReconnectRef = useRef(onReconnect);
  onMessageRef.current = onMessage;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    if (!enabled || !channelName) return;

    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "game_event" }, (payload) => {
        if (payload.payload) {
          onMessageRef.current(payload.payload as AnyEvent);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channelRef.current = channel;
        }
        if (status === "CHANNEL_ERROR") {
          onReconnectRef.current?.();
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, enabled, supabase]);

  const send = useCallback(
    async (event: AnyEvent) => {
      if (!channelRef.current) return;
      await channelRef.current.send({
        type: "broadcast",
        event: "game_event",
        payload: event,
      });
    },
    []
  );

  return { send };
}
