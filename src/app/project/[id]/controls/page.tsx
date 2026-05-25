// src/app/project/[id]/controls/page.tsx
'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getState, setMode, pumpFire, pumpStop, armNudge, toggleSensor, copilotDecision } from '@/lib/api';
import type { SystemState, SystemMode, ArmDirection } from '@/lib/types';
import {
  AlertTriangle, Droplets, Square, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, Eye, Users, Shield, Brain, Check, X,
} from 'lucide-react';

// Sensors as defined in the backend configs/config.json
const SENSORS = [
  { name: 'smoke',     label: 'Smoke (MQ-2)',        desc: 'Gas / smoke · ADS1115 · ppm' },
  { name: 'heat_grid', label: 'Heat grid (AMG8833)', desc: '8×8 thermal array · °C' },
];

const MODES: { value: SystemMode; label: string; icon: typeof Eye; desc: string }[] = [
  { value: 'surveillance', label: 'Surveillance', icon: Eye,    desc: 'Monitor only, no actions' },
  { value: 'copilot',      label: 'Co-pilot',     icon: Users,  desc: 'Approve before acting' },
  { value: 'autopilot',    label: 'Auto-pilot',   icon: Shield, desc: 'Fully autonomous' },
  { value: 'training',     label: 'Training',     icon: Brain,  desc: 'Label & collect data' },
];

export default function ControlsPage() {
  const [state, setState] = useState<SystemState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modeLoading, setModeLoading] = useState(false);
  const [pumpLoading, setPumpLoading] = useState(false);
  const [armLoading, setArmLoading] = useState<ArmDirection | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [sensorLoading, setSensorLoading] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const s = await getState();
      setState(s);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const i = setInterval(refresh, 3000);
    return () => clearInterval(i);
  }, []);

  const handleMode = async (mode: SystemMode) => {
    if (!state || mode === state.system_mode || modeLoading) return;
    setModeLoading(true);
    try { await setMode(mode); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Mode change failed'); }
    setModeLoading(false);
  };

  const handlePump = async (action: 'fire' | 'stop') => {
    setPumpLoading(true);
    setError(null);
    try {
      if (action === 'fire') await pumpFire();
      else await pumpStop();
    } catch (err) { setError(err instanceof Error ? err.message : 'Pump command failed'); }
    setPumpLoading(false);
  };

  const handleArm = async (dir: ArmDirection) => {
    setArmLoading(dir);
    try { await armNudge(dir); }
    catch (err) { setError(err instanceof Error ? err.message : 'Arm command failed'); }
    setArmLoading(null);
  };

  const handleCopilot = async (decision: 'approved' | 'rejected') => {
    setCopilotLoading(true);
    try { await copilotDecision(decision); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Decision failed'); }
    setCopilotLoading(false);
  };

  // `enable` is the target state we want the sensor in.
  const handleSensorToggle = async (name: string, enable: boolean) => {
    setSensorLoading(name);
    try { await toggleSensor(name, enable); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Sensor toggle failed'); }
    setSensorLoading(null);
  };

  if (!state) {
    return (
      <div>
        <TopBar title="Mode & controls" subtitle="System commands and actuator control" />
        {error ? (
          <div className="card p-8 text-center">
            <AlertTriangle size={36} className="mx-auto mb-3" style={{ color: 'var(--warning)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button onClick={refresh} className="btn btn-primary">Retry</button>
          </div>
        ) : (
          <div className="text-center py-16 pulse-soft" style={{ color: 'var(--text-muted)' }}>Connecting...</div>
        )}
      </div>
    );
  }

  const faultedNames = new Set(state.faulted_sensors.map(f => f.name));
  const pendingDecision = state.system_mode === 'copilot' && state.prediction_id !== null && !state.copilot_decision;

  return (
    <div>
      <TopBar title="Mode & controls" subtitle="System commands and actuator control" />

      {error && (
        <div className="card p-3 mb-4 text-sm" style={{ borderColor: 'var(--warning)', background: 'var(--warning-soft)', color: 'var(--warning)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Operating mode */}
        <div className="col-span-12 card p-5 animate-in">
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
            Operating mode
          </div>
          <div className="grid grid-cols-4 gap-3">
            {MODES.map(({ value, label, icon: Icon, desc }) => {
              const isActive = value === state.system_mode;
              return (
                <button
                  key={value}
                  onClick={() => handleMode(value)}
                  disabled={modeLoading}
                  className="flex flex-col items-start gap-1.5 p-4 rounded-xl text-left transition-all cursor-pointer"
                  style={{
                    background: isActive ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                    opacity: modeLoading && !isActive ? 0.5 : 1,
                    outline: 'none',
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <span className="text-[13px] font-semibold" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {label}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pending co-pilot decision */}
        {pendingDecision && (
          <div className="col-span-12 card p-5 animate-in" style={{ borderColor: 'var(--warning)' }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--warning)' }}>
                  Action needs approval
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Danger level <strong style={{ color: 'var(--text-primary)' }}>{state.danger_level}/5</strong> detected.
                  {state.recommended_actions?.length > 0 && (
                    <> Recommended: <strong style={{ color: 'var(--text-primary)' }}>{state.recommended_actions.join(', ')}</strong></>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCopilot('approved')} disabled={copilotLoading} className="btn" style={{ background: 'var(--success)', color: '#fff' }}>
                  <Check size={14} /> Approve
                </button>
                <button onClick={() => handleCopilot('rejected')} disabled={copilotLoading} className="btn btn-ghost" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Water pump */}
        <div className="col-span-6 card p-5 animate-in" style={{ animationDelay: '50ms' }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Water pump
          </div>
          <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>Suppression actuator · max 30s burst</p>
          <div className="flex gap-3">
            <button onClick={() => handlePump('fire')} disabled={pumpLoading} className="btn flex-1" style={{ background: 'var(--danger)', color: '#fff', opacity: pumpLoading ? 0.6 : 1 }}>
              <Droplets size={14} /> Fire pump
            </button>
            <button onClick={() => handlePump('stop')} disabled={pumpLoading} className="btn btn-ghost flex-1" style={{ opacity: pumpLoading ? 0.6 : 1 }}>
              <Square size={14} /> Stop
            </button>
          </div>
        </div>

        {/* Camera arm */}
        <div className="col-span-6 card p-5 animate-in" style={{ animationDelay: '100ms' }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            Camera arm
          </div>
          <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>Pan ±90° · Tilt ±45° · 0.5° steps</p>
          <div className="flex flex-col items-center gap-1">
            <ArmButton dir="tilt_up" loading={armLoading} onClick={handleArm}><ChevronUp size={18} /></ArmButton>
            <div className="flex gap-1">
              <ArmButton dir="pan_left" loading={armLoading} onClick={handleArm}><ChevronLeft size={18} /></ArmButton>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              </div>
              <ArmButton dir="pan_right" loading={armLoading} onClick={handleArm}><ChevronRight size={18} /></ArmButton>
            </div>
            <ArmButton dir="tilt_down" loading={armLoading} onClick={handleArm}><ChevronDown size={18} /></ArmButton>
          </div>
        </div>

        {/* Sensor overrides */}
        <div className="col-span-12 card p-5 animate-in" style={{ animationDelay: '150ms' }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
            Sensor overrides
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SENSORS.map(({ name, label, desc }) => {
              const enabled = !faultedNames.has(name);
              return (
                <div key={name} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="flex items-center gap-3">
                    <span className={`status-dot ${enabled ? 'online' : 'offline'}`} />
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                  </div>
                  <Toggle on={enabled} loading={sensorLoading === name} onClick={() => handleSensorToggle(name, !enabled)} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArmButton({ dir, loading, onClick, children }: {
  dir: ArmDirection; loading: ArmDirection | null; onClick: (d: ArmDirection) => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onClick(dir)}
      disabled={loading !== null}
      className="btn btn-ghost p-0"
      style={{ width: 40, height: 40, opacity: loading === dir ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
}

function Toggle({ on, loading, onClick }: { on: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{ background: on ? 'var(--accent)' : 'var(--border)', opacity: loading ? 0.5 : 1, outline: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer' }}
    >
      <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: on ? 'calc(100% - 22px)' : '2px' }} />
    </button>
  );
}
