// src/app/project/[id]/model-stats/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getTrainingStats, getDangerHistory } from '@/lib/api';
import type { TrainingStats, DangerPoint } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

const HOURS_OPTIONS = [{ label: '1h', value: 1 }, { label: '6h', value: 6 }, { label: '24h', value: 24 }];
const DANGER_COLORS: Record<number, string> = {
  0: 'var(--text-muted)', 1: 'var(--success-text)', 2: '#5A9E6F',
  3: 'var(--warning)', 4: '#D4692E', 5: 'var(--danger)',
};

function DangerChart({ points }: { points: DangerPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height: 150, color: 'var(--text-muted)' }}>
        <p className="text-sm">Not enough data for this range</p>
      </div>
    );
  }
  const W = 820, H = 160;
  const PAD = { t: 10, r: 14, b: 24, l: 28 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const xs = points.map((_, i) => PAD.l + (i / (points.length - 1)) * cw);
  const ys = points.map(p => PAD.t + (1 - p.danger_level / 5) * ch);
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const fill = `${line} L ${xs[xs.length - 1].toFixed(1)} ${(H - PAD.b).toFixed(1)} L ${xs[0].toFixed(1)} ${(H - PAD.b).toFixed(1)} Z`;
  const color = DANGER_COLORS[Math.min(5, Math.max(0, points[points.length - 1].danger_level))];
  const fmt = (ts: number) => new Date(ts * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      {[0, 1, 2, 3, 4, 5].map(v => {
        const y = PAD.t + (1 - v / 5) * ch;
        return (
          <g key={v}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
            <text x={PAD.l - 5} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">{v}</text>
          </g>
        );
      })}
      <path d={fill} fill={color} opacity={0.10} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <text x={PAD.l} y={H - 3} fontSize={9} fill="var(--text-muted)">{fmt(points[0].timestamp)}</text>
      <text x={W - PAD.r} y={H - 3} textAnchor="end" fontSize={9} fill="var(--text-muted)">{fmt(points[points.length - 1].timestamp)}</text>
    </svg>
  );
}

export default function ModelStatsPage() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [dangerPoints, setDangerPoints] = useState<DangerPoint[]>([]);
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, danger] = await Promise.all([getTrainingStats(), getDangerHistory(hours)]);
      setStats(s);
      setDangerPoints(danger.points);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model stats');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const labeledPct = stats && stats.total > 0 ? Math.round((stats.labeled / stats.total) * 100) : 0;

  return (
    <div>
      <TopBar title="Model stats" subtitle="XGBoost model dataset and threat history">
        <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </TopBar>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="card p-6 animate-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Danger level history</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{dangerPoints.length} readings · last {hours}h</div>
              </div>
              <div className="flex gap-1">
                {HOURS_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setHours(o.value)}
                    className="btn"
                    style={{
                      padding: '4px 12px', fontSize: 11,
                      background: hours === o.value ? 'var(--bg-elevated)' : 'transparent',
                      color: hours === o.value ? 'var(--text-primary)' : 'var(--text-muted)',
                      border: `1px solid ${hours === o.value ? 'var(--border)' : 'transparent'}`,
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <DangerChart points={dangerPoints} />
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-6 animate-in" style={{ animationDelay: '100ms' }}>
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Training dataset</div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total', value: stats.total },
                    { label: 'Labeled', value: stats.labeled },
                    { label: 'Pending', value: stats.unlabeled },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
                      <div className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full" style={{ width: `${labeledPct}%`, background: 'var(--accent)' }} />
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{labeledPct}% labeled</div>
                </div>
              </div>

              <div className="card p-6 animate-in" style={{ animationDelay: '150ms' }}>
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Class distribution</div>
                {stats.class_distribution.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No labeled data yet</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {stats.class_distribution.map(({ true_danger_level: lvl, count }) => {
                      const maxCount = Math.max(...stats.class_distribution.map(d => d.count));
                      const pct = (count / (maxCount || 1)) * 100;
                      return (
                        <div key={lvl}>
                          <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                            <span>Level {lvl}</span><span>{count}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: DANGER_COLORS[lvl] ?? 'var(--accent)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
