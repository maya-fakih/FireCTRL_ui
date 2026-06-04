// src/app/project/[id]/config/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import TopBar from '@/components/TopBar';
import { getConfig, updateConfig } from '@/lib/api';
import {
  Settings, Save, RotateCcw, AlertTriangle, Check,
  Cpu, Activity, Camera, Brain, Wrench,
} from 'lucide-react';

// ── Read a deep dot-path out of the config object ───────────────────────
function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// ── Field definitions ───────────────────────────────────────────────────
// Each field is a dot-path that ALREADY exists in config.json — the backend
// rejects unknown keys, so we never invent new paths here.
type FieldType = 'number' | 'text' | 'bool' | 'select';
interface Field {
  path: string;
  label: string;
  type: FieldType;
  hint?: string;
  options?: string[];
  step?: number;
}
interface Group {
  label: string;
  icon: typeof Cpu;
  fields: Field[];
}

const GROUPS: Group[] = [
  {
    label: 'System',
    icon: Cpu,
    fields: [
      { path: 'system.system_mode', label: 'Default mode on boot', type: 'select',
        options: ['surveillance', 'copilot', 'autopilot', 'training'] },
      { path: 'system.polling_interval_idle_ms', label: 'Idle poll (ms)', type: 'number',
        hint: 'Sensor poll rate when no threat' },
      { path: 'system.polling_interval_active_ms', label: 'Active poll (ms)', type: 'number',
        hint: 'Sensor poll rate when triggered' },
    ],
  },
  {
    label: 'Smoke sensor (MQ-2 / ADS1115)',
    icon: Activity,
    fields: [
      { path: 'sensors.smoke.enabled', label: 'Enabled (on boot)', type: 'bool' },
      { path: 'sensors.smoke.address', label: 'I\u00b2C address', type: 'text', hint: 'e.g. 0x48' },
      { path: 'sensors.smoke.channel', label: 'ADC channel', type: 'number' },
      { path: 'sensors.smoke.threshold_physical', label: 'Trigger threshold (ppm)', type: 'number',
        hint: 'Above this, SENSE fires' },
      { path: 'sensors.smoke.equation', label: 'Conversion equation', type: 'text',
        hint: 'raw \u2192 physical formula' },
      { path: 'sensors.smoke.max_retries', label: 'Max retries', type: 'number',
        hint: 'Read attempts before marking faulted' },
    ],
  },
  {
    label: 'Heat grid (AMG8833)',
    icon: Activity,
    fields: [
      { path: 'sensors.heat_grid.enabled', label: 'Enabled (on boot)', type: 'bool' },
      { path: 'sensors.heat_grid.address', label: 'I\u00b2C address', type: 'text', hint: 'e.g. 0x69' },
      { path: 'sensors.heat_grid.threshold_physical', label: 'Trigger threshold (\u00b0C)', type: 'number' },
      { path: 'sensors.heat_grid.max_retries', label: 'Max retries', type: 'number' },
    ],
  },
  {
    label: 'Vision',
    icon: Camera,
    fields: [
      { path: 'vision.camera.fps', label: 'Camera FPS', type: 'number' },
      { path: 'vision.camera.stream_jpeg_quality', label: 'Stream JPEG quality', type: 'number',
        hint: '1\u2013100, lower = smaller/faster' },
      { path: 'vision.models.fire.rpk', label: 'Model file (.rpk)', type: 'text' },
      { path: 'vision.models.fire.conf_threshold', label: 'Detection confidence', type: 'number',
        step: 0.05, hint: '0\u20131 minimum to count a detection' },
    ],
  },
  {
    label: 'Think / AI',
    icon: Brain,
    fields: [
      { path: 'think.active_model', label: 'Active model', type: 'text', hint: 'e.g. xgboost' },
      { path: 'think.max_gap_ms', label: 'SENSE\u2194SEE align gap (ms)', type: 'number' },
      { path: 'think.max_event_gap_ms', label: 'New-event gap (ms)', type: 'number',
        hint: 'Gap before a reading starts a new event' },
      { path: 'think.training.test_split', label: 'Test split', type: 'number', step: 0.05,
        hint: '0\u20131 fraction held out for evaluation' },
      { path: 'think.training.min_rows_to_train', label: 'Min rows to train', type: 'number' },
      { path: 'think.xgboost.n_estimators', label: 'XGB n_estimators', type: 'number' },
      { path: 'think.xgboost.max_depth', label: 'XGB max_depth', type: 'number' },
      { path: 'think.xgboost.learning_rate', label: 'XGB learning_rate', type: 'number', step: 0.01 },
    ],
  },
  {
    label: 'Act / Actuators',
    icon: Wrench,
    fields: [
      { path: 'act.system.danger_threshold_to_act', label: 'Danger threshold to act', type: 'number',
        hint: 'Min danger level that triggers an action' },
      { path: 'act.system.copilot_timeout_s', label: 'Co-pilot timeout (s)', type: 'number' },
      { path: 'act.actuators.pump.pin', label: 'Pump GPIO pin', type: 'number' },
      { path: 'act.actuators.pump.max_duration_s', label: 'Pump max burst (s)', type: 'number' },
      { path: 'act.actuators.arm.joints.pan.pin', label: 'Pan servo pin', type: 'number' },
      { path: 'act.actuators.arm.joints.pan.step_deg', label: 'Pan step (\u00b0)', type: 'number', step: 0.1 },
      { path: 'act.actuators.arm.joints.pan.invert', label: 'Pan invert', type: 'bool' },
      { path: 'act.actuators.arm.joints.tilt.pin', label: 'Tilt servo pin', type: 'number' },
      { path: 'act.actuators.arm.joints.tilt.step_deg', label: 'Tilt step (\u00b0)', type: 'number', step: 0.1 },
      { path: 'act.actuators.arm.joints.tilt.invert', label: 'Tilt invert', type: 'bool' },
      { path: 'act.actuators.arm.feedback.heat_use_threshold_c', label: 'Heat-track threshold (\u00b0C)', type: 'number' },
      { path: 'act.actuators.arm.feedback.tolerance_normalized', label: 'Aim tolerance', type: 'number', step: 0.01,
        hint: '0\u20131 how centered before the arm stops' },
      { path: 'act.actuators.arm.feedback.sensor_offsets.heat.x_bias', label: 'Heat X offset', type: 'number', step: 0.01 },
      { path: 'act.actuators.arm.feedback.sensor_offsets.heat.y_bias', label: 'Heat Y offset', type: 'number', step: 0.01 },
      { path: 'act.actuators.arm.feedback.sensor_offsets.camera.x_bias', label: 'Camera X offset', type: 'number', step: 0.01 },
      { path: 'act.actuators.arm.feedback.sensor_offsets.camera.y_bias', label: 'Camera Y offset', type: 'number', step: 0.01 },
    ],
  },
];

export default function ConfigPage() {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setConfig(await getConfig());
      setEdits({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const valueOf = (path: string): unknown =>
    path in edits ? edits[path] : (config ? getPath(config, path) : undefined);

  const setField = (path: string, value: unknown) => {
    setSaveOk(false);
    setEdits((prev: Record<string, unknown>) => ({ ...prev, [path]: value }));
  };

  const dirtyCount = Object.keys(edits).length;

  const handleSave = async () => {
    if (dirtyCount === 0) return;
    setSaving(true);
    setError(null);
    try {
      await updateConfig(edits);
      setSaveOk(true);
      // Backend restarts all layers; reload after a beat to reflect disk state.
      setTimeout(() => { load(); setSaving(false); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
      setSaving(false);
    }
  };

  const handleDiscard = () => { setEdits({}); setSaveOk(false); };

  return (
    <div>
      <TopBar title="Configuration" subtitle="Edit system settings — saving restarts all layers">
        <button onClick={handleDiscard} disabled={dirtyCount === 0 || saving} className="btn btn-ghost"
          style={{ opacity: dirtyCount === 0 || saving ? 0.5 : 1 }}>
          <RotateCcw size={14} /> Discard
        </button>
        <button onClick={handleSave} disabled={dirtyCount === 0 || saving} className="btn btn-primary"
          style={{ opacity: dirtyCount === 0 || saving ? 0.5 : 1 }}>
          {saveOk ? <Check size={14} /> : <Save size={14} />}
          {saving ? 'Saving & restarting...' : saveOk ? 'Saved' : dirtyCount > 0 ? `Save ${dirtyCount} change${dirtyCount > 1 ? 's' : ''}` : 'Save'}
        </button>
      </TopBar>

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {dirtyCount > 0 && (
        <div className="card p-4 mb-4 flex items-center gap-3 text-sm animate-in"
          style={{ borderColor: 'var(--warning)', background: 'var(--warning-soft)', color: 'var(--warning)' }}>
          <AlertTriangle size={16} />
          <span>Saving writes config.json and <strong>restarts all layers</strong>. Any active recording or training session will be interrupted.</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading config...</div>
      ) : !config ? (
        <div className="card p-12 text-center">
          <Settings size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Could not load config. Check the Pi connection.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {GROUPS.map(({ label, icon: Icon, fields }, gi) => (
            <div key={label} className="card p-5 animate-in" style={{ animationDelay: `${gi * 40}ms` }}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={15} style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {fields.map(field => (
                  <ConfigField
                    key={field.path}
                    field={field}
                    value={valueOf(field.path)}
                    dirty={field.path in edits}
                    onChange={v => setField(field.path, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigField({ field, value, dirty, onChange }: {
  field: Field; value: unknown; dirty: boolean; onChange: (v: unknown) => void;
}) {
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: `1px solid ${dirty ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
    fontFamily: field.type === 'text' ? "'JetBrains Mono', monospace" : 'inherit',
  };

  return (
    <div>
      <label className="text-[11px] mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
        {field.label}
        {dirty && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
      </label>

      {field.type === 'bool' ? (
        <button
          onClick={() => onChange(!value)}
          className="relative w-11 h-6 rounded-full transition-colors"
          style={{ background: value ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer' }}
        >
          <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
            style={{ background: '#fff', left: value ? 'calc(100% - 22px)' : '2px' }} />
        </button>
      ) : field.type === 'select' ? (
        <select value={String(value ?? '')} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : field.type === 'number' ? (
        <input
          type="number"
          step={field.step ?? 1}
          value={value === undefined || value === null ? '' : Number(value)}
          onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          style={inputStyle}
        />
      ) : (
        <input
          type="text"
          value={value === undefined || value === null ? '' : String(value)}
          onChange={e => onChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {field.hint && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{field.hint}</p>
      )}
    </div>
  );
}