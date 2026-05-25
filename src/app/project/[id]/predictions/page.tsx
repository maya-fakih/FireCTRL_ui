// src/app/project/[id]/predictions/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getPredictions, labelPrediction } from '@/lib/api';
import type { Prediction } from '@/lib/types';
import { Tag, AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const DANGER_COLORS: Record<number, string> = {
  0: 'var(--text-muted)', 1: 'var(--success-text)', 2: '#5A9E6F',
  3: 'var(--warning)', 4: '#D4692E', 5: 'var(--danger)',
};
const DANGER_LABELS: Record<number, string> = {
  0: 'No data', 1: 'Low', 2: 'Guarded', 3: 'Elevated', 4: 'High', 5: 'Critical',
};
// Actions available in the backend (configs/config.json -> act.actions.available)
const ACTIONS = ['monitor', 'alert', 'suppress', 'evacuate'];

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlabeledOnly, setUnlabeledOnly] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [labeling, setLabeling] = useState<number | null>(null);
  const [labelForm, setLabelForm] = useState<{ level: number; action: string }>({ level: 1, action: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPredictions({ unlabeled_only: unlabeledOnly, limit: 50 });
      setPredictions(res.predictions);
      setCount(res.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [unlabeledOnly]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const handleLabel = async (id: number) => {
    if (labelForm.level < 1 || labelForm.level > 5) {
      setError('Danger level must be between 1 and 5');
      return;
    }
    setLabeling(id);
    try {
      await labelPrediction(id, labelForm.level, labelForm.action || undefined);
      setPredictions(prev => prev.map(p =>
        p.id === id ? { ...p, validated: true, true_danger_level: labelForm.level, true_action: labelForm.action } : p
      ));
      setExpanded(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Labeling failed');
    }
    setLabeling(null);
  };

  const formatTime = (ts: number) =>
    new Date(ts * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <TopBar title="Predictions" subtitle={`${count} total predictions`}>
        <button
          onClick={() => setUnlabeledOnly(v => !v)}
          className="btn btn-ghost"
          style={{ color: unlabeledOnly ? 'var(--accent)' : undefined, borderColor: unlabeledOnly ? 'var(--accent)' : undefined }}
        >
          <Tag size={14} /> {unlabeledOnly ? 'Unlabeled only' : 'All predictions'}
        </button>
        <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </TopBar>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading predictions...</div>
      ) : predictions.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No predictions yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>The model logs a prediction each time it analyzes an event</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {predictions.map((p, i) => {
            const dLevel = p.danger_level ?? 0;
            const dColor = DANGER_COLORS[Math.min(5, Math.max(0, dLevel))];
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="card animate-in" style={{ animationDelay: `${i * 18}ms` }}>
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : p.id)}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: `${dColor}22`, color: dColor }}>
                    {dLevel}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {p.danger_label ?? DANGER_LABELS[dLevel]}
                      </span>
                      {p.validated
                        ? <span className="badge badge-success"><CheckCircle size={9} /> Labeled</span>
                        : <span className="badge badge-warning">Unlabeled</span>}
                      {p.composite_label && <span className="badge badge-accent">{p.composite_label}</span>}
                      {p.scene_label && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>scene: {p.scene_label}</span>}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(p.timestamp)} · #{p.id}
                    </div>
                  </div>
                  {p.recommended_action && (
                    <span className="text-[11px] px-3 py-1 rounded-full flex-shrink-0" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {p.recommended_action}
                    </span>
                  )}
                  {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                </div>

                {isOpen && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="grid grid-cols-4 gap-3 pt-4 mb-4">
                      <Metric label="Fire detections" value={p.fire_count} danger={(p.fire_count ?? 0) > 0} />
                      <Metric label="Smoke detections" value={p.smoke_count} />
                      <Metric label="Clusters" value={p.cluster_count} />
                      <Metric label="Scene conf." value={p.scene_confidence !== null ? `${(p.scene_confidence * 100).toFixed(0)}%` : null} />
                    </div>

                    {(p.glimpsed_fire || p.human_near_fire) && (
                      <div className="flex gap-2 mb-4">
                        {p.glimpsed_fire && <span className="badge badge-danger">Fire glimpsed</span>}
                        {p.human_near_fire && <span className="badge badge-warning">Human near fire</span>}
                      </div>
                    )}

                    {p.validated ? (
                      <div className="p-3 rounded-lg text-[12px]" style={{ background: 'var(--success-soft)', color: 'var(--success-text)' }}>
                        Labeled as level <strong>{p.true_danger_level}</strong>
                        {p.true_action && <> · action <strong>{p.true_action}</strong></>}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="text-[11px] uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                          Label this prediction
                        </div>
                        <div className="flex items-end gap-3 flex-wrap">
                          <div style={{ width: 140 }}>
                            <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                              True danger (1–5)
                            </label>
                            <input
                              type="number" min={1} max={5}
                              value={labelForm.level}
                              onChange={e => setLabelForm(f => ({ ...f, level: Number(e.target.value) }))}
                              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                            />
                          </div>
                          <div style={{ width: 180 }}>
                            <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                              True action (optional)
                            </label>
                            <select
                              value={labelForm.action}
                              onChange={e => setLabelForm(f => ({ ...f, action: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                            >
                              <option value="">—</option>
                              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                          <button onClick={() => handleLabel(p.id)} disabled={labeling === p.id} className="btn btn-primary">
                            {labeling === p.id ? 'Saving...' : 'Save label'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: number | string | null; danger?: boolean }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-base font-bold mt-0.5" style={{ color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
