// src/app/project/[id]/notifications/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getNotifications, acknowledgeNotification } from '@/lib/api';
import type { Notification, Severity } from '@/lib/types';
import { Bell, CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';

const SEV_META: Record<Severity, { label: string; badge: string; color: string; icon: typeof Info }> = {
  info:     { label: 'Info',     badge: 'badge-accent',  color: 'var(--accent)',  icon: Info },
  warn:     { label: 'Warning',  badge: 'badge-warning', color: 'var(--warning)', icon: AlertTriangle },
  critical: { label: 'Critical', badge: 'badge-danger',  color: 'var(--danger)',  icon: AlertTriangle },
};

const FILTERS = ['all', 'unread', 'critical', 'warn', 'info'] as const;
type Filter = typeof FILTERS[number];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [acking, setAcking] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof getNotifications>[0] = { limit: 100 };
      if (filter === 'unread') params.unack_only = true;
      else if (filter === 'critical' || filter === 'warn' || filter === 'info') params.severity = filter;
      const res = await getNotifications(params);
      setNotifs(res.notifications);
      setCount(res.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const handleAck = async (id: number) => {
    setAcking(id);
    try {
      await acknowledgeNotification(id);
      setNotifs(prev => prev.map(n => (n.id === id ? { ...n, acknowledged: true } : n)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acknowledge failed');
    }
    setAcking(null);
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const unreadCount = notifs.filter(n => !n.acknowledged).length;

  return (
    <div>
      <TopBar title="Notifications" subtitle={`${count} total${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}>
        <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </TopBar>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn"
            style={{
              padding: '6px 14px', fontSize: 12,
              background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : SEV_META[f].label}
          </button>
        ))}
      </div>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading notifications...</div>
      ) : notifs.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nothing here</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Alerts appear here as the system runs</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifs.map((n, i) => {
            const meta = SEV_META[n.severity] ?? SEV_META.info;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className="card p-4 animate-in flex items-start gap-3"
                style={{ animationDelay: `${i * 18}ms`, opacity: n.acknowledged ? 0.55 : 1, borderLeft: `3px solid ${meta.color}` }}
              >
                <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`badge ${meta.badge}`}>{meta.label}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {n.source_layer && <>{n.source_layer} · </>}{formatTime(n.timestamp)}
                    </span>
                  </div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {n.event_type.replace(/_/g, ' ')}
                  </div>
                  {n.payload && Object.keys(n.payload).length > 0 && (
                    <div className="text-[11px] mt-1 truncate" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {JSON.stringify(n.payload)}
                    </div>
                  )}
                </div>
                {!n.acknowledged && (
                  <button onClick={() => handleAck(n.id)} disabled={acking === n.id} className="flex-shrink-0 btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>
                    <CheckCircle size={12} /> {acking === n.id ? '...' : 'Ack'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
