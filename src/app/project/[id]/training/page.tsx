// src/app/project/[id]/training/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getTrainingStats, triggerTraining, getTrainStatus } from '@/lib/api';
import type { TrainingStats, TrainJob } from '@/lib/types';
import { Brain, Play, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const DANGER_COLORS: Record<number, string> = {
  0: 'var(--text-muted)', 1: 'var(--success-text)', 2: '#5A9E6F',
  3: 'var(--warning)', 4: '#D4692E', 5: 'var(--danger)',
};

export default function TrainingPage() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [job, setJob] = useState<TrainJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStats = async () => {
    try {
      setStats(await getTrainingStats());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load training stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    setError(null);
    try {
      const res = await triggerTraining();
      setJob({ job_id: res.job_id, status: 'running' });
      pollRef.current = setInterval(async () => {
        try {
          const j = await getTrainStatus(res.job_id);
          setJob(j);
          if (j.status !== 'running') {
            if (pollRef.current) clearInterval(pollRef.current);
            setTraining(false);
            await loadStats();
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          setTraining(false);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start training');
      setTraining(false);
    }
  };

  const labeledPct = stats ? Math.round((stats.labeled / (stats.total || 1)) * 100) : 0;
  const canTrain = !!stats && stats.labeled > 0 && !training;

  return (
    <div>
      <TopBar title="Training" subtitle="Retrain the XGBoost model on labeled predictions">
        <button onClick={loadStats} className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
        <button onClick={handleTrain} disabled={!canTrain} className="btn btn-primary" style={{ opacity: canTrain ? 1 : 0.6 }}>
          <Play size={14} /> {training ? 'Training...' : 'Start training'}
        </button>
      </TopBar>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {job && (
        <div
          className="card p-4 mb-4 flex items-center gap-3 animate-in"
          style={{ borderColor: job.status === 'done' ? 'var(--success)' : job.status === 'failed' ? 'var(--danger)' : 'var(--accent)' }}
        >
          {job.status === 'running'
            ? <Brain size={16} className="pulse-soft" style={{ color: 'var(--accent)' }} />
            : job.status === 'done'
            ? <CheckCircle size={16} style={{ color: 'var(--success-text)' }} />
            : <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {job.status === 'running' ? 'Training in progress...' : job.status === 'done' ? 'Training complete' : 'Training failed'}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              Job {job.job_id}{job.error ? ` · ${job.error}` : ''}
            </div>
          </div>
          {job.result && (
            <span className="text-[11px] px-3 py-1 rounded-full flex-shrink-0" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
              {JSON.stringify(job.result).slice(0, 80)}
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading stats...</div>
      ) : stats ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 card p-6 animate-in">
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>Dataset overview</div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total', value: stats.total, color: 'var(--text-primary)' },
                { label: 'Labeled', value: stats.labeled, color: 'var(--success-text)' },
                { label: 'Unlabeled', value: stats.unlabeled, color: 'var(--warning)' },
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
              <div className="h-full rounded-full transition-all" style={{ width: `${labeledPct}%`, background: labeledPct >= 80 ? 'var(--success-text)' : labeledPct >= 40 ? 'var(--accent)' : 'var(--warning)' }} />
            </div>
            {stats.labeled === 0 && (
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Label predictions on the Predictions tab before training. The backend needs at least 20 rows to train.
              </p>
            )}
          </div>

          <div className="col-span-4 card p-6 animate-in" style={{ animationDelay: '100ms' }}>
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
      ) : (
        <div className="card p-12 text-center">
          <Brain size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Could not load training stats</p>
        </div>
      )}
    </div>
  );
}
