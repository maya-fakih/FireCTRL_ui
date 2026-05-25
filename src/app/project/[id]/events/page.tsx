// src/app/project/[id]/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getNotifications } from '@/lib/api';
import type { Notification, Severity } from '@/lib/types';
import { List, RefreshCw } from 'lucide-react';

const SEV_STYLE: Record<Severity, { color: string; dot: string }> = {
  info:     { color: 'var(--accent)',  dot: 'online' },
  warn:     { color: 'var(--warning)', dot: 'warning' },
  critical: { color: 'var(--danger)',  dot: 'danger' },
};

export default function EventsPage() {
  const [events, setEvents] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 200 });
      setEvents(res.notifications);
      setCount(res.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  const GRID = '1fr 130px 150px 80px';

  return (
    <div>
      <TopBar title="Event log" subtitle={`${count} events recorded`}>
        <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </TopBar>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <List size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No events yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>System events appear here in chronological order</p>
        </div>
      ) : (
        <div className="card animate-in overflow-hidden">
          <div
            className="grid px-4 py-2.5 text-[10px] uppercase tracking-wider"
            style={{ gridTemplateColumns: GRID, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <span>Event</span><span>Source</span><span>Time</span><span>Severity</span>
          </div>
          {events.map((ev, i) => {
            const sev = SEV_STYLE[ev.severity] ?? SEV_STYLE.info;
            return (
              <div
                key={ev.id}
                className="grid px-4 py-3 items-center animate-in"
                style={{ gridTemplateColumns: GRID, borderBottom: '1px solid var(--border-subtle)', animationDelay: `${i * 12}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`status-dot ${sev.dot} flex-shrink-0`} />
                  <div className="min-w-0">
                    <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                      {ev.event_type.replace(/_/g, ' ')}
                    </span>
                    {ev.payload && Object.keys(ev.payload).length > 0 && (
                      <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {JSON.stringify(ev.payload)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{ev.source_layer ?? '—'}</span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatTime(ev.timestamp)}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: sev.color }}>{ev.severity}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
