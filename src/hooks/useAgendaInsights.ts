import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InsightItem {
  icon: "clock" | "calendar" | "trending" | "users" | "scissors" | "alert";
  title: string;
  description: string;
  type: "info" | "warning" | "success" | "tip";
}

export interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface AgendaMetrics {
  occupancy_rate: number;
  cancellation_rate: number;
  no_show_rate: number;
  confirmation_rate: number;
  busiest_hour: string;
  slowest_day: string;
  top_service: string;
  empty_slots_today: number;
}

export interface AgendaInsights {
  insights: InsightItem[];
  recommendations: Recommendation[];
  metrics: AgendaMetrics;
  suggested_time: string | null;
  rawMetrics: {
    monthTotal: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShows: number;
    pending: number;
    emptySlots: number;
    frequentNoShows: [string, number][];
  };
}

export function useAgendaInsights() {
  const [data, setData] = useState<AgendaInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("agenda-insights");

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      setData(result as AgendaInsights);
    } catch (err: any) {
      const msg = err?.message || "Erro ao buscar insights";
      setError(msg);
      toast({
        title: "Erro nos insights",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { data, loading, error, fetchInsights };
}
