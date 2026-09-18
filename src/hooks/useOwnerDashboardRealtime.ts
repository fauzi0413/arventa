"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type RealtimeConnectionStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "OFFLINE"
  | "DISABLED";

interface UseOwnerDashboardRealtimeOptions {
  /** Supabase user ID of the authenticated owner */
  ownerId: string | null;
  /** Called (debounced) whenever a relevant DB change is detected */
  onDataChange: () => void;
  /** Set false to skip subscribing (user paused auto-sync) */
  enabled?: boolean;
  /** Debounce delay in ms before calling onDataChange (default 800) */
  debounceMs?: number;
}

/**
 * useOwnerDashboardRealtime
 *
 * Subscribes to Supabase Realtime postgres_changes on the four tables that
 * drive owner dashboard metrics:
 *   - Invoice   (INSERT / UPDATE)         -> Revenue, Pending amount
 *   - Expense   (INSERT / UPDATE / DELETE) -> OpEx, Net Profit
 *   - Unit      (UPDATE)                   -> Occupancy rate, Status breakdown
 *   - Lease     (INSERT / UPDATE)          -> Active leases count
 *
 * When a change arrives it calls `onDataChange()` after a debounce delay so
 * that rapid bursts result in a single re-fetch.
 *
 * Data is still fetched from /api/dashboard/stats via Prisma.
 * Supabase Realtime is used purely as an event trigger.
 */
export function useOwnerDashboardRealtime({
  ownerId,
  onDataChange,
  enabled = true,
  debounceMs = 800,
}: UseOwnerDashboardRealtimeOptions) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>(
    enabled && ownerId ? "CONNECTING" : "DISABLED"
  );

  const onDataChangeRef = useRef(onDataChange);
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerDebounced = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onDataChangeRef.current();
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    if (!enabled || !ownerId) {
      setStatus("DISABLED");
      return;
    }

    setStatus("CONNECTING");

    let channel: any = null;

    try {
      const supabase = createClient();

      channel = supabase
        .channel(`owner_dashboard_${ownerId}`)
        // Invoice: revenue & pending
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "Invoice" }, () => triggerDebounced())
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Invoice" }, () => triggerDebounced())
        // Expense: OpEx & net profit
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "Expense" }, () => triggerDebounced())
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Expense" }, () => triggerDebounced())
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "Expense" }, () => triggerDebounced())
        // Unit: occupancy rate & status breakdown
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Unit" }, () => triggerDebounced())
        // Lease: active leases count
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "Lease" }, () => triggerDebounced())
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Lease" }, () => triggerDebounced())
        .subscribe((subscribeStatus: string) => {
          switch (subscribeStatus) {
            case "SUBSCRIBED":
              setStatus("CONNECTED");
              break;
            case "CHANNEL_ERROR":
            case "TIMED_OUT":
              setStatus("RECONNECTING");
              break;
            case "CLOSED":
              setStatus("OFFLINE");
              break;
            default:
              break;
          }
        });
    } catch (err) {
      console.warn("[useOwnerDashboardRealtime] Subscription error:", err);
      setStatus("OFFLINE");
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch (_) {}
      }
      setStatus("DISABLED");
    };
  }, [ownerId, enabled, triggerDebounced]);

  return { status };
}
