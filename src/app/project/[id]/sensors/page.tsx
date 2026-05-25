// src/app/project/[id]/sensors/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getSensorHistory } from '@/lib/api';
import { Activity, RefreshCw } from 'lucide-react';

// Sensors as defined in the backend configs/config.json
const SENSORS = [
  { key: 'smoke',     label: 'Smoke (MQ-2)', unit: 'ppm' },
  { key: 'heat_grid', label: 'Heat grid',    unit: '°C' },
];
const HOURS_OPTIONS = [{ label: '1h', value: 1 }, { label: '6h', value: 6 }, { label: '24h', value: 24 }];

// With a sensor filter the API returns points of shape { timestamp, value }
interface SensorPoint { timestamp: number; value: number }

function LineChart({ points, color, unit }: { points: SensorPoint[]; color: string; unit: string }) {
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height: 160, color: 'var(--text-muted)' }}>
        <p className="text-sm">Not enough data for this range</p>
      </div>
    );
  }
  const values = points.map(p => Number(p.value ?? 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 820, H = 180;
  const PAD = { t: 12, r: 14, b: 26, l: 48 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const xs = points.map((_, i) => PAD.l + (i / (points.length - 1)) * cw);
  const ys = values.map(v => PAD.t + (1 - (v - min) / range) * ch);
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const fill = `${line} L ${xs[xs.length - 1].toFixed(1)} ${(H - PAD.b).toFixed(1)} L ${xs[0].toFixed(1)} ${(H - PAD.b).toFixed(1)} Z`;
  const yTicks = [0, 0.5, 1].map(t => ({ y: PAD.t + (1 - t) * ch, label: (min + t * range).toFixed(1) }));
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
      {yTicks.map(t => (
        <g key={t.y}>
          <line x1={PAD.l} y1={t.y} x2={W - PAD.r} y2={t.y} stroke="var(--border-subtle)" strokeWidth={1} />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">{t.label}</text>
        </g>
      ))}
      <path d={fill} fill={color} opacity={0.09} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <text x={PAD.l} y={H - 4} fontSize={10} fill="var(--text-muted)">{fmt(points[0].timestamp)}</text>
      <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">{fmt(points[points.length - 1].timestamp)}</text>
      <text x={PAD.l} y={10} fontSize={10} fill="var(--text-muted)">{unit}</text>
    </svg>
  );
}

export default function SensorsPage() {
  const [sensor, setSensor] = useState(SENSORS[0].key);
  const [hours, setHours] = useState(1);
  const [points, setPoints] = useState<SensorPoint[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSensorHistory(hours, sensor);
      setPoints(res.points as SensorPoint[]);
      setCount(res.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sensor history');
    } finally {
      setLoading(false);
    }
  }, [sensor, hours]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const current = SENSORS.find(s => s.key === sensor)!;
  const latest = points.length > 0 ? Number(points[points.length - 1].value) : null;

  return (
    <div>
      <TopBar title="Sensor history" subtitle="Historical readings logged on the Pi">
        <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </TopBar>

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex gap-1">
          {SENSORS.map(s => (
            <button
              key={s.key}
              onClick={() => setSensor(s.key)}
              className="btn"
              style={{
                padding: '6px 14px', fontSize: 12,
                background: sensor === s.key ? 'var(--accent)' : 'var(--bg-card)',
                color: sensor === s.key ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${sensor === s.key ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {HOURS_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setHours(o.value)}
              className="btn"
              style={{
                padding: '6px 14px', fontSize: 12,
                background: hours === o.value ? 'var(--bg-elevated)' : 'var(--bg-card)',
                color: hours === o.value ? 'var(--text-primary)' : 'var(--text-muted)',
                border: `1px solid ${hours === o.value ? 'var(--border)' : 'var(--border-subtle)'}`,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div className="card p-5 animate-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{current.label}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{count} data points · last {hours}h</div>
          </div>
          <div className="flex items-center gap-4">
            {latest !== null && (
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Latest</div>
                <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{latest.toFixed(1)} <span className="text-xs">{current.unit}</span></div>
              </div>
            )}
            <Activity size={16} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center pulse-soft" style={{ height: 160, color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <LineChart points={points} color="var(--accent)" unit={current.unit} />
        )}
      </div>
    </div>
  );
}
