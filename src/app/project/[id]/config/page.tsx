// src/app/project/[id]/config/page.tsx
'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getState, toggleSensor } from '@/lib/api';
import type { SystemState } from '@/lib/types';
import { Settings, RefreshCw, AlertTriangle, Cpu } from 'lucide-react';

// Sensors as defined in the backend configs/config.json
const SENSORS = [
  { name: 'smoke',     label: 'Smoke (MQ-2)',        desc: 'Gas / smoke via ADS1115 ADC', detail: 'Threshold 300 ppm · 0x48' },
  { name: 'heat_grid', label: 'Heat grid (AMG8833)', desc: '8×8 infrared thermal array',  detail: 'Threshold 50 °C · 0x69' },
];

export default function ConfigPage() {
  const [state, setState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    try {
      setState(await getState());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const handleToggle = async (name: string, enable: boolean) => {
    setToggling(name);
    try {
      await toggleSensor(name, enable);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setToggling(null);
    }
  };

  const faultedNames = new Set(state?.faulted_sensors.map(f => f.name) ?? []);

  return (
    <div>
      <TopBar title="Configuration" subtitle="Sensor and system configuration">
        <button onClick={load} className="btn btn-ghost"><RefreshCw size={14} /> Refresh</button>
      </TopBar>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div className="max-w-2xl flex flex-col gap-4">
        <div className="card p-6 animate-in">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={15} style={{ color: 'var(--accent)' }} />
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Sensor configuration</div>
          </div>

          {loading ? (
            <div className="py-8 text-center pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : !state ? (
            <div className="py-8 text-center">
              <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: 'var(--warning)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Could not reach the Pi</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {SENSORS.map(sensor => {
                const enabled = !faultedNames.has(sensor.name);
                return (
                  <div key={sensor.name} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', opacity: toggling === sensor.name ? 0.7 : 1 }}>
                    <div className="flex items-center gap-3">
                      <span className={`status-dot ${enabled ? 'online' : 'offline'}`} />
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{sensor.label}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sensor.desc}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{sensor.detail}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(sensor.name, !enabled)}
                      disabled={toggling !== null}
                      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                      style={{ background: enabled ? 'var(--accent)' : 'var(--border)', outline: 'none', border: 'none', cursor: toggling !== null ? 'wait' : 'pointer' }}
                    >
                      <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', left: enabled ? 'calc(100% - 22px)' : '2px' }} />
                    </button>
                  </div>
                );
              })}
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {state.active_sensor_count} of {SENSORS.length} sensors active
              </p>
            </div>
          )}
        </div>

        {/* Hardware reference */}
        <div className="card p-6 animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Hardware</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Board', value: 'Raspberry Pi 5' },
              { label: 'Camera', value: 'Sony IMX500 AI Camera' },
              { label: 'Model', value: 'XGBoost classifier' },
              { label: 'Actuators', value: 'Water pump · Pan-tilt arm' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                <div className="text-[13px] font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
