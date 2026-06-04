'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import {
  getTrainingStats, triggerTraining, getTrainStatus,
  getCameraFeedUrl,
  recordingStart, recordingStop, recordingPushLabel,
} from '@/lib/api';
import type { TrainingStats, TrainJob } from '@/lib/types';
import { Brain, Play, CheckCircle, AlertTriangle, RefreshCw, FlipVertical, Circle, Square } from 'lucide-react';

const LEVELS = [
  { n: 1, name: 'Low',      color: '#639922' },
  { n: 2, name: 'Guarded',  color: '#5DCAA5' },
  { n: 3, name: 'Elevated', color: '#BA7517' },
  { n: 4, name: 'High',     color: '#D85A30' },
  { n: 5, name: 'Critical', color: '#E24B4A' },
];

const DIST_COLORS: Record<number, string> = {
  1: '#639922', 2: '#5DCAA5', 3: '#BA7517', 4: '#D85A30', 5: '#E24B4A',
};

export default function TrainingPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [stats, setStats]         = useState<TrainingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [flipped, setFlipped]     = useState(false);

  // Recording
  const [recording, setRecording]     = useState(false);
  const [recLoading, setRecLoading]   = useState(false);
  const [dangerLevel, setDangerLevel] = useState<number>(1);
  const [eventId, setEventId]         = useState<number | null>(null);

  const stripRef   = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);

  // ── Stats (manual refresh only) ────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await getTrainingStats());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Camera (continuous poll) ────────────────────────────────────────
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── Heat strip drag ─────────────────────────────────────────────────
  const levelFromX = useCallback((clientX: number) => {
    const el = stripRef.current;
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(0.9999, (clientX - rect.left) / rect.width));
    return Math.floor(pct * 5) + 1;
  }, []);

  const pickLevel = useCallback((n: number) => {
    setDangerLevel(n);
    if (recording) recordingPushLabel(n).catch(() => {});
  }, [recording]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      pickLevel(levelFromX(x));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove as EventListener, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove as EventListener);
      window.removeEventListener('touchend', onUp);
    };
  }, [levelFromX, pickLevel]);

  // ── Recording toggle ────────────────────────────────────────────────
  const handleRecordToggle = async () => {
    setRecLoading(true);
    setError(null);
    try {
      if (recording) {
        await recordingStop();
        setRecording(false);
        setEventId(null);
        await loadStats();
      } else {
        const res = await recordingStart(true);
        setEventId(res.event_id);
        setRecording(true);
        await recordingPushLabel(dangerLevel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recording error');
    } finally {
      setRecLoading(false);
    }
  };

  const labeledPct  = stats ? Math.round((stats.labeled / (stats.total || 1)) * 100) : 0;
  const activeLevel = LEVELS.find(l => l.n === dangerLevel) ?? LEVELS[0];

  return (
    <div>
      <TopBar title="Training" subtitle="Record labeled data and retrain the model">
        <button onClick={loadStats} className="btn btn-ghost">
          <RefreshCw size={14} /> Refresh stats
        </button>
        <button
          onClick={() => router.push(`/project/${id}/dataset`)}
          className="btn btn-primary"
        >
          <Play size={14} /> Review dataset
        </button>
      </TopBar>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">

        {/* Camera + controls */}
        <div className="col-span-12 card overflow-hidden animate-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Live camera</span>
            {recording && eventId !== null && (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>event #{eventId}</span>
            )}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getCameraFeedUrl()}
            alt="Live camera"
            className="w-full block"
            style={{ maxHeight: 340, objectFit: 'contain', background: 'var(--bg-elevated)', transform: flipped ? 'scaleY(-1)' : 'none', transition: 'transform 0.2s ease' }}
          />

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)' }}>

            {/* Level readout */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 500, color: activeLevel.color, transition: 'color 0.1s' }}>{dangerLevel}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: activeLevel.color, transition: 'color 0.1s' }}>{activeLevel.name}</span>
              {!recording && (
                <span className="text-xs" style={{ color: 'var(--text-muted)', marginLeft: 4 }}>— start recording to capture</span>
              )}
            </div>

            {/* Heat strip */}
            <div
              ref={stripRef}
              style={{ display: 'flex', gap: 5, marginBottom: 10, cursor: 'pointer', userSelect: 'none' }}
              onMouseDown={e => { dragging.current = true; pickLevel(levelFromX(e.clientX)); }}
              onTouchStart={e => { dragging.current = true; pickLevel(levelFromX(e.touches[0].clientX)); }}
            >
              {LEVELS.map(l => {
                const active = l.n === dangerLevel;
                return (
                  <div key={l.n} style={{
                    flex: 1, height: 52, borderRadius: 8,
                    border: `1.5px solid ${active ? l.color : 'var(--border-subtle)'}`,
                    background: active ? l.color + '28' : 'var(--bg-elevated)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    transform: active ? 'scaleY(1.06)' : 'scaleY(1)',
                    transition: 'all 0.1s',
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 500, color: l.color, lineHeight: 1 }}>{l.n}</span>
                    <span style={{ fontSize: 9, color: active ? l.color : 'var(--text-muted)', lineHeight: 1 }}>{l.name}</span>
                  </div>
                );
              })}
            </div>

            {/* Two buttons: flip + record */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setFlipped(f => !f)}
                className="btn btn-ghost"
                style={{ flex: '0 0 auto' }}
              >
                <FlipVertical size={14} />
                {flipped ? 'Unflip' : 'Flip'}
              </button>
              <button
                onClick={handleRecordToggle}
                disabled={recLoading}
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  gap: 8,
                  background: recording ? 'var(--danger-soft)' : 'var(--bg-elevated)',
                  borderColor: recording ? 'var(--danger)' : 'var(--border)',
                  color: recording ? 'var(--danger)' : 'var(--text-primary)',
                  opacity: recLoading ? 0.6 : 1,
                }}
              >
                {recording
                  ? <><Square size={13} fill="currentColor" /> Stop recording</>
                  : <><Circle size={13} fill="#E24B4A" color="#E24B4A" /> Start recording</>}
              </button>
            </div>
          </div>
        </div>

        {/* Dataset overview */}
        <div className="col-span-8 card p-6 animate-in">
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Dataset overview</div>
          {statsLoading ? (
            <div className="text-sm pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Total',     value: stats.total,    color: 'var(--text-primary)' },
                  { label: 'Labeled',   value: stats.labeled,  color: '#639922' },
                  { label: 'Unlabeled', value: stats.unlabeled, color: '#BA7517' },
                ].map(item => (
                  <div key={item.label} className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="text-3xl font-bold" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-[11px] mt-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                <span>Labeling progress</span><span>{labeledPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${labeledPct}%`,
                  background: labeledPct >= 80 ? '#639922' : labeledPct >= 40 ? 'var(--accent)' : '#BA7517',
                }} />
              </div>
              {stats.labeled === 0 && (
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  Record a session to capture labeled data. You need at least 20 labeled rows to train.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Could not load stats.</p>
          )}
        </div>

        {/* Class distribution */}
        <div className="col-span-4 card p-6 animate-in" style={{ animationDelay: '80ms' }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Class distribution</div>
          {statsLoading ? (
            <div className="text-sm pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : stats?.class_distribution.length ? (
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
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: DIST_COLORS[lvl] ?? 'var(--accent)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No labeled data yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}