import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MessageLog {
  id: string;
  user_id: string;
  appointment_id: string | null;
  reminder_id: string | null;
  recipient_phone: string;
  recipient_type: "client" | "owner";
  message_type: "confirmation" | "reminder_24h" | "reminder_2h" | "bot_reply";
  message_content: string | null;
  status: "pending" | "sent" | "failed" | "delivered";
  twilio_sid: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface MessageLogStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: {
    confirmation: number;
    reminder_24h: number;
    reminder_2h: number;
    bot_reply: number;
  };
}

export function useMessageLogs(options?: { 
  limit?: number; 
  status?: string; 
  messageType?: string;
  userId?: string;
}) {
  const { limit = 50, status, messageType, userId } = options || {};

  return useQuery({
    queryKey: ["message-logs", { limit, status, messageType, userId }],
    queryFn: async (): Promise<MessageLog[]> => {
      let query = supabase
        .from("whatsapp_message_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      }

      if (messageType) {
        query = query.eq("message_type", messageType);
      }

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching message logs:", error);
        throw error;
      }

      return (data || []) as MessageLog[];
    },
  });
}

export function useMessageLogStats() {
  return useQuery({
    queryKey: ["message-log-stats"],
    queryFn: async (): Promise<MessageLogStats> => {
      // Get counts by status
      const { data: logs, error } = await supabase
        .from("whatsapp_message_logs")
        .select("status, message_type");

      if (error) {
        console.error("Error fetching message log stats:", error);
        throw error;
      }

      const stats: MessageLogStats = {
        total: logs?.length || 0,
        sent: 0,
        failed: 0,
        pending: 0,
        byType: {
          confirmation: 0,
          reminder_24h: 0,
          reminder_2h: 0,
          bot_reply: 0,
        },
      };

      logs?.forEach((log) => {
        // Count by status
        if (log.status === "sent" || log.status === "delivered") {
          stats.sent++;
        } else if (log.status === "failed") {
          stats.failed++;
        } else if (log.status === "pending") {
          stats.pending++;
        }

        // Count by type
        if (log.message_type === "confirmation") {
          stats.byType.confirmation++;
        } else if (log.message_type === "reminder_24h") {
          stats.byType.reminder_24h++;
        } else if (log.message_type === "reminder_2h") {
          stats.byType.reminder_2h++;
        } else if (log.message_type === "bot_reply") {
          stats.byType.bot_reply++;
        }
      });

      return stats;
    },
  });
}
