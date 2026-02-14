import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WebhookLog {
  id: string;
  event_type: string;
  event_action: string | null;
  external_payment_id: string | null;
  external_reference: string | null;
  payment_id: string | null;
  status: string;
  severity: string;
  payload: unknown;
  response_data: unknown;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

export interface AdminAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  metadata: unknown;
  is_read: boolean;
  resolved_at: string | null;
  created_at: string;
}

export function useWebhookMonitoring() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setLogs((data || []) as WebhookLog[]);
    } catch (e) {
      console.error('Error fetching webhook logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const { data, error } = await supabase
        .from('admin_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const alertData = (data || []) as AdminAlert[];
      setAlerts(alertData);
      setUnreadCount(alertData.filter(a => !a.is_read).length);
    } catch (e) {
      console.error('Error fetching admin alerts:', e);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  const markAlertRead = async (alertId: string) => {
    await supabase.from('admin_alerts').update({ is_read: true }).eq('id', alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await supabase.from('admin_alerts').update({ is_read: true }).eq('is_read', false);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnreadCount(0);
  };

  const resolveAlert = async (alertId: string) => {
    await supabase.from('admin_alerts').update({ resolved_at: new Date().toISOString(), is_read: true }).eq('id', alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved_at: new Date().toISOString(), is_read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    fetchLogs();
    fetchAlerts();
  }, [fetchLogs, fetchAlerts]);

  // Realtime alerts
  useEffect(() => {
    const channel = supabase
      .channel('admin-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAlerts]);

  const getHealthStatus = () => {
    const recentLogs = logs.filter(l => {
      const age = Date.now() - new Date(l.created_at).getTime();
      return age < 24 * 60 * 60 * 1000; // last 24h
    });
    const criticalErrors = recentLogs.filter(l => l.severity === 'critical');
    const errors = recentLogs.filter(l => l.severity === 'error');

    if (criticalErrors.length > 0) return { status: 'critical', label: 'Erro Crítico', color: 'text-destructive' };
    if (errors.length > 0) return { status: 'partial', label: 'Falha Parcial', color: 'text-amber-600' };
    return { status: 'operational', label: 'Operacional', color: 'text-emerald-600' };
  };

  return {
    logs, alerts, loadingLogs, loadingAlerts, unreadCount,
    fetchLogs, fetchAlerts, markAlertRead, markAllRead, resolveAlert, getHealthStatus,
  };
}
