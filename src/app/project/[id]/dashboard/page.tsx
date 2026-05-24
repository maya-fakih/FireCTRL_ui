// src/app/project/[id]/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getState, setMode } from '@/lib/api';
import type { SystemState, SystemMode } from '@/lib/types';
import {
  Activity, Radio, Camera, AlertTriangle,
  Eye, Users, Shield, Brain,
  Radio as RadioIcon, Cpu, Database,
} from 'lucide-react';

const MODE_META: Record<SystemMode, { label: string; desc: string; icon: typeof Eye }> = {
  surveillance: { label: 'Surveillance', desc: 'Monitor only',      icon: Eye },
  copilot:      { label: 'Co-pilot',     desc: 'Approve actions',   icon: Users },
  autopilot:    { label: 'Auto-pilot',   desc: 'Fully autonomous',  icon: Shield },
  training:     { label: 'Training',     desc: 'Label & retrain',   icon: Brain },
};

const DANGER_COLORS: Record<number, string> = {
  0: 'var(--text-muted)', 1: 'var(--success-text)', 2: '#5A9E6F',
  3: 'var(--warning)', 4: '#D4692E', 5: 'var(--danger)',
};

const DANGER_LABELS: Record<number, string> = {
  0: 'No Data', 1: 'Clear', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical',
};

export default function DashboardPage() {
  const [state, setState] = useState<SystemState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [modeLoading, setModeLoading] = useState(false);

  const fetchState = async () => {
    try {
      const data = await getState();
      setState(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  useEffect(() => {
    fetchState();
    const i = setInterval(fetchState, 2000);
    return () => clearInterval(i);
  }, []);

  const handleMode = async (mode: SystemMode) => {
    if (!state || mode === state.system_mode || modeLoading) return;
    setModeLoading(true);
    try {
      await setMode(mode);
      await fetchState();
    } catch { /* silent */ }
    setModeLoading(false);
  };

  if (error && !state) {
    return (
      <div>
        <TopBar title="Dashboard" />
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="card p-8 text-center" style={{ maxWidth: 400 }}>
            <AlertTriangle size={40} className="mx-auto mb-4" style={{ color: 'var(--warning)' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Cannot reach the Pi
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Check the Pi URL in Connection settings
            </p>
            <button onClick={fetchState} className="btn btn-primary">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div>
        <TopBar title="Dashboard" />
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="pulse-soft" style={{ color: 'var(--text-muted)' }}>Connecting to system...</div>
        </div>
      </div>
    );
  }

  const dangerColor = DANGER_COLORS[Math.min(5, Math.max(0, state.danger_level))];
  const dangerLabel = DANGER_LABELS[Math.min(5, Math.max(0, state.danger_level))];

  const layers = [
    { label: 'SENSE', running: state.sense_running, icon: RadioIcon },
    { label: 'SEE',   running: state.see_running,   icon: Camera },
    { label: 'THINK', running: state.think_running,  icon: Brain },
    { label: 'ACT',   running: state.act_running,    icon: Cpu },
    { label: 'DB',    running: state.db_connected,   icon: Database },
  ];

  return (
    <div>
      <TopBar
        title="System overview"
        subtitle={
          lastUpdate
            ? `Last update: ${lastUpdate.toLocaleTimeString()}${error ? ' · connection issues' : ''}`
            : 'Connecting...'
        }
      >
        <div className="flex items-center gap-2">
          <span className={`status-dot ${state.system_running ? 'online' : 'offline'}`} />
          <span
            className="text-[11px] font-semibold"
            style={{ color: state.system_running ? 'var(--success-text)' : 'var(--text-muted)' }}
          >
            {state.system_running ? 'System online' : 'System offline'}
          </span>
        </div>
      </TopBar>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: stats + mode + pipeline */}
        <div className="col-span-8 flex flex-col gap-4">
          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Sensors */}
            <div className="card p-5 animate-in">
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Active sensors
              </div>
              <div className="flex items-center gap-2">
                <span className={`status-dot ${state.faulted_sensors.length > 0 ? 'warning' : 'online'}`} />
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {state.active_sensor_count}
                </span>
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                {state.faulted_sensors.length > 0 ? `${state.faulted_sensors.length} faulted` : 'All healthy'}
              </div>
            </div>

            {/* Action */}
            <div className="card p-5 animate-in" style={{ animationDelay: '50ms' }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Current action
              </div>
              <div className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {state.recommended_actions?.length > 0 ? state.recommended_actions[0] : 'None'}
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                Danger level {state.danger_level}/5
              </div>
            </div>

            {/* Camera */}
            <div className="card p-5 animate-in" style={{ animationDelay: '100ms' }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Camera
              </div>
              <div className="flex items-center gap-2">
                <span className={`status-dot ${state.camera_feed_active ? 'online' : 'offline'}`} />
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {state.camera_feed_active ? 'Active' : 'Idle'}
                </span>
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                {state.camera_feed_active ? 'Streaming' : 'Standby'}
              </div>
            </div>
          </div>

          {/* Mode switcher + Pipeline */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mode */}
            <div className="card p-5 animate-in" style={{ animationDelay: '150ms' }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                Operating mode
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(MODE_META) as [SystemMode, typeof MODE_META.autopilot][]).map(([value, meta]) => {
                  const active = value === state.system_mode;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={value}
                      onClick={() => handleMode(value)}
                      disabled={modeLoading}
                      className="flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all cursor-pointer"
                      style={{
                        background: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        border: active ? '1px solid var(--accent)' : '1px solid transparent',
                        opacity: modeLoading && !active ? 0.5 : 1,
                        outline: 'none',
                      }}
                    >
                      <Icon size={14} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                      <span className="text-[12px] font-semibold" style={{ color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {meta.label}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{meta.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pipeline */}
            <div className="card p-5 animate-in" style={{ animationDelay: '200ms' }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                Pipeline status
              </div>
              <div className="flex flex-col gap-2">
                {layers.map(({ label, running, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 px-3 rounded-lg"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={13} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status-dot ${running ? 'online' : 'offline'}`} />
                      <span
                        className="text-[10px] uppercase tracking-wider font-medium"
                        style={{ color: running ? 'var(--success-text)' : 'var(--text-muted)' }}
                      >
                        {running ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: danger gauge */}
        <div className="col-span-4">
          <div className="card p-6 animate-in flex flex-col items-center justify-center text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
              Threat level
            </div>
            {/* Ring */}
            <div className="relative w-32 h-32 mb-4">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none" stroke={dangerColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(state.danger_level / 5) * 314} 314`}
                  style={{
                    filter: state.danger_level >= 4 ? `drop-shadow(0 0 8px ${dangerColor})` : 'none',
                    transition: 'stroke-dasharray 0.8s ease, stroke 0.3s ease',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: dangerColor }}>{state.danger_level}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>/ 5</span>
              </div>
            </div>
            <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: dangerColor }}>
              {dangerLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
