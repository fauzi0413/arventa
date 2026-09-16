"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChatRoomResponseData,
  PropertyChatMessageItem,
  ChatResidentItem,
  AvailablePropertyOption,
  ChatRoomProperty,
  ChatCurrentUser,
} from "../types/chat";

export function usePropertyChat(initialPropertyId?: string) {
  const [propertyId, setPropertyId] = useState<string | undefined>(initialPropertyId);
  const [property, setProperty] = useState<ChatRoomProperty | null>(null);
  const [currentUser, setCurrentUser] = useState<ChatCurrentUser | null>(null);
  const [residents, setResidents] = useState<ChatResidentItem[]>([]);
  const [availableProperties, setAvailableProperties] = useState<AvailablePropertyOption[]>([]);
  const [activeTenantsCount, setActiveTenantsCount] = useState<number>(0);
  const [managementCount, setManagementCount] = useState<number>(0);

  const [messages, setMessages] = useState<PropertyChatMessageItem[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<PropertyChatMessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  // Reference to track latest message timestamp for fast delta polling
  const latestMessageTimestampRef = useRef<string | null>(null);
  const messagesRef = useRef<PropertyChatMessageItem[]>([]);
  messagesRef.current = messages;

  // Load initial or switched room data
  const loadRoomData = useCallback(async (targetPropertyId?: string, isSilentRefresh = false) => {
    if (!isSilentRefresh) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }

    try {
      const url = targetPropertyId
        ? `/api/community/chat?propertyId=${encodeURIComponent(targetPropertyId)}`
        : "/api/community/chat";

      const res = await fetch(url, { method: "GET", cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || "Gagal memuat ruang obrolan warga kost.");
        if (json.data?.availableProperties) {
          setAvailableProperties(json.data.availableProperties);
        }
        return;
      }

      const data: ChatRoomResponseData = json.data;
      setProperty(data.property);
      setCurrentUser(data.currentUser);
      setResidents(data.residents || []);
      setAvailableProperties(data.availableProperties || []);
      setActiveTenantsCount(data.activeTenantsCount || 0);
      setManagementCount(data.managementCount || 0);
      setMessages(data.messages || []);
      setPinnedMessages(
        data.pinnedMessages || (data.messages || []).filter((m) => m.isPinned)
      );

      if (data.property?.id) {
        setPropertyId(data.property.id);
      }

      if (data.messages && data.messages.length > 0) {
        latestMessageTimestampRef.current = data.messages[data.messages.length - 1].createdAt;
      } else {
        latestMessageTimestampRef.current = new Date().toISOString();
      }
    } catch (err: any) {
      console.error("loadRoomData error:", err);
      setError(err?.message || "Terjadi kesalahan jaringan saat memuat ruang obrolan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadRoomData(initialPropertyId);
  }, [loadRoomData, initialPropertyId]);

  // Delta polling fallback: Every 3.5s fetch messages created after latestMessageTimestampRef
  useEffect(() => {
    if (!propertyId || loading) return;

    const intervalId = setInterval(async () => {
      // Only poll when document is visible
      if (typeof document !== "undefined" && document.hidden) return;

      const since = latestMessageTimestampRef.current;
      if (!since) return;

      try {
        const url = `/api/community/chat?propertyId=${encodeURIComponent(propertyId)}&since=${encodeURIComponent(since)}`;
        const res = await fetch(url, { method: "GET", credentials: "same-origin" });
        if (!res.ok) return;

        const json = await res.json();
        if (json.success) {
          const incoming: PropertyChatMessageItem[] = json.data?.messages || [];
          const statusUpdates = json.data?.statusUpdates || [];

          setMessages((prev) => {
            let updated = [...prev];

            // 1. Update read statuses of existing messages (Ceklis 1 -> Ceklis 2 -> Ceklis 2 Biru)
            if (statusUpdates.length > 0) {
              const statusMap = new Map(statusUpdates.map((s: any) => [s.id, s]));
              updated = updated.map((m) => {
                const update = statusMap.get(m.id) as any;
                if (update) {
                  return {
                    ...m,
                    readStatus: update.readStatus,
                    readCount: update.readCount,
                    totalRecipients: update.totalRecipients,
                  };
                }
                return m;
              });
            }

            // 2. Append new incoming messages
            if (incoming.length > 0) {
              const existingIds = new Set(updated.map((m) => m.id));
              const newItems = incoming.filter((m) => !existingIds.has(m.id));
              if (newItems.length > 0) {
                updated = [...updated, ...newItems];
                latestMessageTimestampRef.current = updated[updated.length - 1].createdAt;
              }
            }

            return updated;
          });
        }
      } catch (pollErr) {
        // Silent catch for background polling
      }
    }, 3500);

    return () => clearInterval(intervalId);
  }, [propertyId, loading]);

  // Supabase Realtime Channel Subscription
  useEffect(() => {
    if (!propertyId) return;

    let channel: any = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`room_${propertyId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "property_chat_messages",
            filter: `property_id=eq.${propertyId}`,
          },
          (payload: any) => {
            const newRow = payload.new;
            if (!newRow || !newRow.id) return;

            const mappedMessage: PropertyChatMessageItem = {
              id: newRow.id,
              propertyId: newRow.property_id || newRow.propertyId,
              senderId: newRow.sender_id || newRow.senderId,
              messageType: newRow.message_type || newRow.messageType || "CHAT",
              content: newRow.content,
              mediaUrl: newRow.media_url || newRow.mediaUrl,
              senderName: newRow.sender_name || newRow.senderName || "Warga Kost",
              senderUnitNumber: newRow.sender_unit_number || newRow.senderUnitNumber,
              senderRole: newRow.sender_role || newRow.senderRole || "WARGA",
              createdAt: newRow.created_at || newRow.createdAt || new Date().toISOString(),
            };

            setMessages((prev) => {
              // Replace optimistic message if match or append
              const exists = prev.some((m) => m.id === mappedMessage.id);
              if (exists) return prev;

              // Check if matches a pending optimistic message from same sender
              const pendingIndex = prev.findIndex(
                (m) =>
                  m.pending &&
                  m.senderId === mappedMessage.senderId &&
                  m.content.trim() === mappedMessage.content.trim()
              );

              let updated: PropertyChatMessageItem[];
              if (pendingIndex !== -1) {
                updated = [...prev];
                updated[pendingIndex] = mappedMessage;
              } else {
                updated = [...prev, mappedMessage];
              }

              latestMessageTimestampRef.current = mappedMessage.createdAt;
              return updated;
            });
          }
        )
        .subscribe((status: string) => {
          setIsRealtimeConnected(status === "SUBSCRIBED");
        });
    } catch (realtimeErr) {
      console.warn("Supabase Realtime subscription warning:", realtimeErr);
      setIsRealtimeConnected(false);
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch (_) {}
      }
      setIsRealtimeConnected(false);
    };
  }, [propertyId]);

  // Send Message with Optimistic UI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!propertyId || !content.trim() || sending) return false;

      const trimmed = content.trim();
      const tempId = `temp_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const totalRecipientsCount =
        activeTenantsCount + managementCount > 1
          ? activeTenantsCount + managementCount - 1
          : 0;

      const optimisticMessage: PropertyChatMessageItem = {
        id: tempId,
        propertyId,
        senderId: currentUser?.id || "me",
        messageType: "CHAT",
        content: trimmed,
        mediaUrl: null,
        senderName: currentUser?.name || "Saya",
        senderUnitNumber: currentUser?.unitNumber || null,
        senderRole: currentUser?.role || "WARGA",
        createdAt: nowIso,
        readStatus: "SENT",
        readCount: 0,
        totalRecipients: totalRecipientsCount,
        pending: true,
      };

      // Optimistic append
      setMessages((prev) => [...prev, optimisticMessage]);
      setSending(true);

      try {
        const res = await fetch("/api/community/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId,
            content: trimmed,
            messageType: "CHAT",
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          // Mark optimistic message with error
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, pending: false, error: true } : m))
          );
          return false;
        }

        const savedMessage: PropertyChatMessageItem = json.data;

        // Replace optimistic message with actual saved message
        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === tempId);
          if (index !== -1) {
            const copy = [...prev];
            copy[index] = savedMessage;
            return copy;
          }
          if (!prev.some((m) => m.id === savedMessage.id)) {
            return [...prev, savedMessage];
          }
          return prev;
        });

        latestMessageTimestampRef.current = savedMessage.createdAt;
        return true;
      } catch (sendErr: any) {
        console.error("sendMessage error:", sendErr);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false, error: true } : m))
        );
        return false;
      } finally {
        setSending(false);
      }
    },
    [propertyId, currentUser, sending]
  );

  // Switch Property (Owner/Housekeeping)
  const switchProperty = useCallback(
    (newPropertyId: string) => {
      if (newPropertyId === propertyId) return;
      setPropertyId(newPropertyId);
      loadRoomData(newPropertyId);
    },
    [propertyId, loadRoomData]
  );

  // Pin Message (Admin only)
  const pinMessage = useCallback(
    async (messageId: string) => {
      if (!propertyId) return false;
      try {
        const res = await fetch("/api/community/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, action: "pin_message", messageId }),
        });
        const json = await res.json();
        if (json.success) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, isPinned: true } : m))
          );
          setPinnedMessages((prev) => {
            const target = messages.find((m) => m.id === messageId);
            if (target && !prev.some((p) => p.id === messageId)) {
              return [{ ...target, isPinned: true }, ...prev];
            }
            return prev;
          });
          return true;
        }
      } catch (e) {
        console.error("pinMessage error:", e);
      }
      return false;
    },
    [propertyId, messages]
  );

  // Unpin Message (Admin only)
  const unpinMessage = useCallback(
    async (messageId: string) => {
      if (!propertyId) return false;
      try {
        const res = await fetch("/api/community/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, action: "unpin_message", messageId }),
        });
        const json = await res.json();
        if (json.success) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, isPinned: false } : m))
          );
          setPinnedMessages((prev) => prev.filter((p) => p.id !== messageId));
          return true;
        }
      } catch (e) {
        console.error("unpinMessage error:", e);
      }
      return false;
    },
    [propertyId]
  );

  // Manual Refresh
  const refresh = useCallback(() => {
    return loadRoomData(propertyId, true);
  }, [loadRoomData, propertyId]);

  return {
    propertyId,
    property,
    currentUser,
    residents,
    availableProperties,
    activeTenantsCount,
    managementCount,
    messages,
    pinnedMessages,
    loading,
    refreshing,
    sending,
    error,
    isRealtimeConnected,
    sendMessage,
    pinMessage,
    unpinMessage,
    switchProperty,
    refresh,
  };
}
