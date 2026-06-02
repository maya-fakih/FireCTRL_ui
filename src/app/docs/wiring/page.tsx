'use client';

import { useState, useEffect, useRef } from 'react';
import TopBar from '@/components/TopBar';
import { Cpu, Zap, Thermometer, Wind, Camera, Wrench } from 'lucide-react';

type ComponentId = 'pi' | 'atx' | 'amg' | 'ads' | 'mq2' | 'servo' | 'pump' | 'cam' | null;

// ── Wire color → component mapping (traced from Fritzing breadboard view) ───
// #cc1414  red        = 5 V rail (ATX → Pi, servos, relay, sensors)
// #ef6100  orange     = 3.3 V rail / relay signal wire
// #fff800  yellow     = SCL bus + ATX 12 V → relay COM
// #25cc35  green      = SDA bus (Pi GPIO2 → AMG8833 + ADS1115)
// #ab58a2  purple     = GPIO17 pump relay signal
// #418dd9  blue       = servo signal wires (GPIO27 / GPIO22)
// #8c3b00  brown      = MQ-2 voltage divider → ADS1115 A0
// #404040  dark grey  = GND (all components)
// #ffffff  white      = MQ-2 heater wire

const COMPONENT_COLORS: Record<string, string[]> = {
  atx:   ['#cc1414', '#ef6100', '#fff800', '#404040'],
  pi:    ['#cc1414', '#ef6100', '#fff800', '#25cc35', '#ab58a2', '#418dd9', '#404040'],
  amg:   ['#cc1414', '#25cc35', '#fff800', '#404040'],
  ads:   ['#cc1414', '#25cc35', '#fff800', '#8c3b00', '#404040'],
  mq2:   ['#cc1414', '#ef6100', '#8c3b00', '#ffffff', '#404040'],
  servo: ['#cc1414', '#418dd9', '#404040'],
  pump:  ['#cc1414', '#ef6100', '#fff800', '#ab58a2', '#404040'],
  cam:   [],
};

// SVG partID → component (for body group highlighting)
const PARTID_MAP: Record<string, string> = {
  '854378390': 'pi',
  '854378850': 'servo',
  '854378880': 'servo',
  '854378920': 'ads',
  '854378960': 'amg',
  '854379440': 'pump',
  '854380840': 'atx',
  '854386000': 'mq2',
  '854392680': 'mq2',
  '854400050': 'mq2',
  '57900':     '_breadboard',
};

const COMPONENTS = [
  { id: 'atx',   label: 'ATX PSU',        sub: '12 V / 5 V / 3.3 V rails', icon: Zap },
  { id: 'pi',    label: 'Raspberry Pi 5', sub: 'GPIO + I²C + power',       icon: Cpu },
  { id: 'amg',   label: 'AMG8833',        sub: '8×8 thermal — I²C 0x69',   icon: Thermometer },
  { id: 'ads',   label: 'ADS1115',        sub: '16-bit ADC — I²C 0x48',    icon: Cpu },
  { id: 'mq2',   label: 'MQ-2',           sub: 'Gas sensor — analog',       icon: Wind },
  { id: 'servo', label: 'Servos',         sub: 'Pan GPIO27 · Tilt GPIO22',  icon: Wrench },
  { id: 'pump',  label: 'Pump + Relay',   sub: 'GPIO17 → HW-482 → 12 V',   icon: Zap },
  { id: 'cam',   label: 'IMX500',         sub: 'CSI ribbon — no GPIO',      icon: Camera },
] as const;

const WIRE_TABLE: Record<string, { from: string; to: string; color: string; label: string }[]> = {
  atx: [
    { color: '#cc1414', label: '5 V (red)',        from: 'ATX 5 V rail',  to: 'Pi Pin 2+4, Servo VCC, Relay VCC, MQ-2 H+A' },
    { color: '#ef6100', label: '3.3 V (orange)',   from: 'ATX 3.3 V rail',to: 'AMG8833 VIN, ADS1115 VDD' },
    { color: '#fff800', label: '12 V (yellow)',    from: 'ATX 12 V rail', to: 'Relay COM → pump' },
    { color: '#404040', label: 'GND (grey)',       from: 'ATX GND',       to: 'All component grounds' },
  ],
  pi: [
    { color: '#25cc35', label: 'SDA — GPIO2 (Pin 3)',  from: 'Pi GPIO2',  to: 'Breadboard SDA bus → AMG8833 + ADS1115' },
    { color: '#fff800', label: 'SCL — GPIO3 (Pin 5)',  from: 'Pi GPIO3',  to: 'Breadboard SCL bus → AMG8833 + ADS1115' },
    { color: '#ab58a2', label: 'GPIO17 (Pin 11)',       from: 'Pi GPIO17', to: 'Relay IN pin (pump control)' },
    { color: '#418dd9', label: 'GPIO27 (Pin 13)',       from: 'Pi GPIO27', to: 'Breadboard → Pan servo signal' },
    { color: '#418dd9', label: 'GPIO22 (Pin 15)',       from: 'Pi GPIO22', to: 'Breadboard → Tilt servo signal' },
    { color: '#cc1414', label: '5 V (Pin 2+4)',         from: 'ATX 5 V',   to: 'Pi power input' },
    { color: '#404040', label: 'GND (Pin 6+9)',         from: 'ATX GND',   to: 'Pi ground' },
  ],
  amg: [
    { color: '#cc1414', label: 'VIN → 5 V',    from: 'ATX 5 V',      to: 'AMG8833 VIN' },
    { color: '#404040', label: 'GND',           from: 'ATX GND',      to: 'AMG8833 GND' },
    { color: '#fff800', label: 'SCL → row 37',  from: 'AMG8833 SCL',  to: 'Breadboard SCL bus (shared with ADS1115 + Pi)' },
    { color: '#25cc35', label: 'SDA → row 36',  from: 'AMG8833 SDA',  to: 'Breadboard SDA bus (shared with ADS1115 + Pi)' },
  ],
  ads: [
    { color: '#cc1414', label: 'VDD → 5 V',     from: 'ATX 5 V',     to: 'ADS1115 VDD' },
    { color: '#404040', label: 'GND',            from: 'ATX GND',     to: 'ADS1115 GND + ADDR → 0x48' },
    { color: '#fff800', label: 'SCL → row 37',   from: 'ADS1115 SCL', to: 'Breadboard SCL bus (shared with AMG8833 + Pi)' },
    { color: '#25cc35', label: 'SDA → row 36',   from: 'ADS1115 SDA', to: 'Breadboard SDA bus (shared with AMG8833 + Pi)' },
    { color: '#8c3b00', label: 'A0 ← divider',   from: 'Voltage divider junction', to: 'ADS1115 A0 (MQ-2 analog reading)' },
  ],
  mq2: [
    { color: '#cc1414', label: 'H + A → 5 V',     from: 'ATX 5 V',          to: 'MQ-2 H pins (heater) + A pins' },
    { color: '#404040', label: 'B → GND',          from: 'MQ-2 B pin',       to: 'Resistor → GND (voltage divider)' },
    { color: '#8c3b00', label: 'Divider → A0',     from: 'Resistor junction', to: 'ADS1115 A0' },
    { color: '#ffffff', label: 'Heater (white)',    from: 'MQ-2 heater',      to: 'Breadboard power rail' },
  ],
  servo: [
    { color: '#cc1414', label: 'Red → 5 V',          from: 'ATX 5 V',       to: 'Servo 1 + 2 VCC' },
    { color: '#404040', label: 'GND (grey)',          from: 'ATX GND',       to: 'Servo 1 + 2 GND' },
    { color: '#418dd9', label: 'Blue → GPIO27/22',    from: 'Breadboard',    to: 'Pi GPIO27 (pan) + GPIO22 (tilt)' },
  ],
  pump: [
    { color: '#ab58a2', label: 'Purple → GPIO17', from: 'Pi GPIO17',  to: 'HW-482 relay IN' },
    { color: '#cc1414', label: 'VCC → 5 V',       from: 'ATX 5 V',   to: 'Relay VCC' },
    { color: '#404040', label: 'GND',              from: 'ATX GND',   to: 'Relay GND' },
    { color: '#fff800', label: 'COM → 12 V',      from: 'ATX 12 V',  to: 'Relay COM → pump +' },
    { color: '#ef6100', label: 'D4 signal',        from: 'Pi',        to: 'Relay D4 (control)' },
  ],
  cam: [
    { color: '#888888', label: 'CSI ribbon', from: 'IMX500 CSI connector', to: 'Pi 5 CAM0 port — no GPIO wires' },
  ],
};

export default function WiringPage() {
  const [active, setActive] = useState<ComponentId>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);

  useEffect(() => {
    fetch('/wiring_diagram.svg')
      .then(r => r.text())
      .then(svgText => {
        if (svgContainerRef.current) {
          svgContainerRef.current.innerHTML = svgText;
          const svgEl = svgContainerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.height = 'auto';
          }
          setSvgLoaded(true);
        }
      });
  }, []);

  useEffect(() => {
    if (!svgLoaded || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;

    const allGroups = svgEl.querySelectorAll<HTMLElement>('g[partID]');
    const allWirePaths = svgEl.querySelectorAll<HTMLElement>('path[stroke], line[stroke]');

    // ── Nothing selected → reset everything ──
    if (!active) {
      allGroups.forEach(el => {
        el.style.opacity = '1';
        el.style.transition = 'opacity 0.25s ease';
      });
      allWirePaths.forEach(el => {
        el.style.opacity = '';
        el.style.filter = '';
        el.style.transition = 'opacity 0.25s ease';
      });
      return;
    }

    // ── Component selected → dim everything, then brighten matches ──
    const activeColors = new Set((COMPONENT_COLORS[active] || []).map(c => c.toLowerCase()));

    // 1. Dim/brighten component body groups by partID
    allGroups.forEach(el => {
      const pid = el.getAttribute('partID') || '';
      const owner = PARTID_MAP[pid];
      el.style.transition = 'opacity 0.25s ease';

      if (owner === '_breadboard') {
        el.style.opacity = '0.35';
      } else if (owner === active) {
        el.style.opacity = '1';
      } else if (owner) {
        // Known component, not selected
        el.style.opacity = '0.1';
      } else {
        // Wire group or unknown — check children for matching stroke
        const childPaths = el.querySelectorAll('path[stroke], line[stroke]');
        let hasMatch = false;
        childPaths.forEach(p => {
          const s = (p.getAttribute('stroke') || '').toLowerCase();
          if (activeColors.has(s)) hasMatch = true;
        });
        el.style.opacity = hasMatch ? '1' : '0.08';
      }
    });

    // 2. Handle paths/lines NOT inside a partID group (loose elements)
    allWirePaths.forEach(el => {
      // Skip if inside a partID group (already handled above)
      if (el.closest('g[partID]')) return;
      const stroke = (el.getAttribute('stroke') || '').toLowerCase();
      const svgOpacity = el.getAttribute('opacity') || '1';
      if (parseFloat(svgOpacity) < 0.5) return; // skip decorative dots
      const isActive = activeColors.has(stroke);
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = isActive ? '1' : '0.08';
      el.style.filter = '';
    });
  }, [active, svgLoaded]);

  return (
    <div>
      <TopBar title="Wiring" subtitle="Hardware connections — FYP FireCTRL robot" />

      {/* Component selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {COMPONENTS.map(c => {
          const Icon = c.icon;
          const isActive = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActive(isActive ? null : c.id as ComponentId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: 'none',
                background: isActive ? 'var(--color-accent)' : 'var(--color-surface-secondary)',
                color: isActive ? '#fff' : 'var(--color-text-primary)',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              <span style={{ fontSize: 13 }}>{c.label}</span>
            </button>
          );
        })}
        {active && (
          <button
            onClick={() => setActive(null)}
            style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', background: 'var(--color-surface-secondary)', color: 'var(--color-text-secondary)', fontSize: 13 }}
          >
            Clear ×
          </button>
        )}
      </div>

      {/* Fritzing SVG */}
      <div className="card" style={{ padding: 16, marginBottom: 24, overflow: 'auto' }}>
        {!svgLoaded && (
          <div style={{ color: 'var(--color-text-muted)', padding: 40, textAlign: 'center', fontSize: 13 }}>
            Loading diagram...
          </div>
        )}
        <div ref={svgContainerRef} style={{ minWidth: 600 }} />
      </div>

      {/* Wire table */}
      {active && WIRE_TABLE[active] && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)' }}>
            {COMPONENTS.find(c => c.id === active)?.label} — connections
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: 'var(--color-text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '6px 12px', fontWeight: 500 }}>Wire</th>
                <th style={{ padding: '6px 12px', fontWeight: 500 }}>From</th>
                <th style={{ padding: '6px 12px', fontWeight: 500 }}>To</th>
              </tr>
            </thead>
            <tbody>
              {WIRE_TABLE[active].map((w, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: w.color, border: w.color === '#404040' || w.color === '#000000' ? '1px solid #777' : w.color === '#ffffff' ? '1px solid #ccc' : 'none', flexShrink: 0 }} />
                      <span>{w.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{w.from}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{w.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!active && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
          Click a component above to highlight its connections
        </div>
      )}
    </div>
  );
}