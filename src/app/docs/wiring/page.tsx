'use client';

import { useState, useEffect, useRef } from 'react';
import TopBar from '@/components/TopBar';
import { Cpu, Zap, Thermometer, Wind, Camera, Wrench } from 'lucide-react';

type ComponentId = 'pi' | 'atx' | 'amg' | 'ads' | 'mq2' | 'servo' | 'pump' | 'cam' | null;

// ── Exact color→component mapping traced from the SVG ──────────────────────
// #8c0000  dark red   = 5V rail (ATX → Pi, servos, relay VCC)
// #ad6a38  orange     = 3.3V rail (ATX → AMG VIN, ADS VDD) + relay signal
// #d6d63a  yellow-grn = SCL bus (Pi GPIO3 → breadboard → AMG8833 → ADS1115)
// #00a527  green      = SDA bus (Pi GPIO2 → breadboard → AMG8833 → ADS1115)
// #7a3a73  purple     = GPIO17 pump relay signal (Pi → relay IN)
// #1b5bb3  blue       = servo signal wires (Pi GPIO27/22 → breadboard → servos)
// #ffff00  yellow     = servo signal short wires at servo body (→ breadboard)
// #6c2710  brown      = MQ-2 voltage divider → ADS1115 A0
// #999999  grey       = relay NC/NO output wire
// #000000  black      = GND (all components)

const COMPONENT_COLORS: Record<string, string[]> = {
  atx:   ['#8c0000', '#ad6a38', '#d6d63a', '#000000'],
  pi:    ['#8c0000', '#ad6a38', '#d6d63a', '#00a527', '#7a3a73', '#1b5bb3', '#000000'],
  amg:   ['#ad6a38', '#d6d63a', '#00a527', '#000000'],
  ads:   ['#ad6a38', '#d6d63a', '#00a527', '#6c2710', '#000000'],
  mq2:   ['#6c2710', '#8c0000', '#000000'],
  servo: ['#ffff00', '#1b5bb3', '#8c0000', '#000000'],
  pump:  ['#7a3a73', '#999999', '#8c0000', '#000000'],
  cam:   [],
};

const COMPONENTS = [
  { id: 'atx',   label: 'ATX PSU',        sub: '12V / 5V / 3.3V rails',    icon: Zap },
  { id: 'pi',    label: 'Raspberry Pi 5', sub: 'GPIO + I2C + power',        icon: Cpu },
  { id: 'amg',   label: 'AMG8833',        sub: '8×8 thermal — I2C 0x69',   icon: Thermometer },
  { id: 'ads',   label: 'ADS1115',        sub: '16-bit ADC — I2C 0x48',    icon: Cpu },
  { id: 'mq2',   label: 'MQ-2',           sub: 'Gas sensor — analog',       icon: Wind },
  { id: 'servo', label: 'Servos',         sub: 'Pan GPIO27 · Tilt GPIO22',  icon: Wrench },
  { id: 'pump',  label: 'Pump + Relay',   sub: 'GPIO17 → HW-482 → 12V',    icon: Zap },
  { id: 'cam',   label: 'IMX500',         sub: 'CSI ribbon — no GPIO',      icon: Camera },
] as const;

const WIRE_TABLE: Record<string, { from: string; to: string; color: string; label: string }[]> = {
  atx: [
    { color: '#8c0000', label: '5V (dark red)',    from: 'ATX 5V rail',   to: 'Pi Pin 2+4, Servo VCC, Relay VCC, MQ-2 H+A' },
    { color: '#ad6a38', label: '3.3V (orange)',    from: 'ATX 3.3V rail', to: 'AMG8833 VIN, ADS1115 VDD' },
    { color: '#000000', label: 'GND (black)',       from: 'ATX GND',       to: 'All component grounds' },
  ],
  pi: [
    { color: '#00a527', label: 'SDA — GPIO2 (Pin 3)',  from: 'Pi GPIO2',  to: 'Breadboard SDA bus → AMG8833 + ADS1115' },
    { color: '#d6d63a', label: 'SCL — GPIO3 (Pin 5)',  from: 'Pi GPIO3',  to: 'Breadboard SCL bus → AMG8833 + ADS1115' },
    { color: '#7a3a73', label: 'GPIO17 (Pin 11)',       from: 'Pi GPIO17', to: 'Relay IN pin (pump control)' },
    { color: '#1b5bb3', label: 'GPIO27 (Pin 13)',       from: 'Pi GPIO27', to: 'Breadboard → Pan servo signal' },
    { color: '#1b5bb3', label: 'GPIO22 (Pin 15)',       from: 'Pi GPIO22', to: 'Breadboard → Tilt servo signal' },
    { color: '#8c0000', label: '5V (Pin 2+4)',          from: 'ATX 5V',    to: 'Pi power input' },
    { color: '#000000', label: 'GND (Pin 6+9)',         from: 'ATX GND',   to: 'Pi ground' },
  ],
  amg: [
    { color: '#ad6a38', label: 'VIN → 3.3V',   from: 'ATX 3.3V',     to: 'AMG8833 VIN' },
    { color: '#000000', label: 'GND',           from: 'ATX GND',      to: 'AMG8833 GND' },
    { color: '#d6d63a', label: 'SCL → row 38', from: 'AMG8833 SCL',  to: 'Breadboard SCL bus (shared with ADS1115 + Pi)' },
    { color: '#00a527', label: 'SDA → row 36', from: 'AMG8833 SDA',  to: 'Breadboard SDA bus (shared with ADS1115 + Pi)' },
  ],
  ads: [
    { color: '#ad6a38', label: 'VDD → 3.3V',    from: 'ATX 3.3V',    to: 'ADS1115 VDD' },
    { color: '#000000', label: 'GND',            from: 'ATX GND',     to: 'ADS1115 GND' },
    { color: '#d6d63a', label: 'SCL → row 38',  from: 'ADS1115 SCL', to: 'Breadboard SCL bus (shared with AMG8833 + Pi)' },
    { color: '#00a527', label: 'SDA → row 36',  from: 'ADS1115 SDA', to: 'Breadboard SDA bus (shared with AMG8833 + Pi)' },
    { color: '#000000', label: 'ADDR → GND',    from: 'ADS1115 ADDR',to: 'GND → I2C address 0x48' },
    { color: '#6c2710', label: 'A0 ← divider',  from: 'Voltage divider junction', to: 'ADS1115 A0 (MQ-2 analog reading)' },
  ],
  mq2: [
    { color: '#8c0000', label: 'H + A → 5V',    from: 'ATX 5V',         to: 'MQ-2 H pins (heater) + A pins' },
    { color: '#000000', label: 'B → GND',        from: 'MQ-2 B pin',     to: 'Resistor → GND (voltage divider)' },
    { color: '#6c2710', label: 'Divider → A0',   from: 'Resistor junction', to: 'ADS1115 A0' },
  ],
  servo: [
    { color: '#8c0000', label: 'Red → 5V',          from: 'ATX 5V',    to: 'Servo 1 + 2 VCC' },
    { color: '#000000', label: 'Black → GND',        from: 'ATX GND',   to: 'Servo 1 + 2 GND' },
    { color: '#ffff00', label: 'Yellow signal wire', from: 'Servo body', to: 'Breadboard signal row' },
    { color: '#1b5bb3', label: 'Blue → GPIO27',      from: 'Breadboard row', to: 'Pi GPIO27 (pan servo)' },
    { color: '#1b5bb3', label: 'Blue → GPIO22',      from: 'Breadboard row', to: 'Pi GPIO22 (tilt servo)' },
  ],
  pump: [
    { color: '#7a3a73', label: 'Purple → GPIO17',  from: 'Pi GPIO17',  to: 'HW-482 relay IN' },
    { color: '#8c0000', label: 'VCC → 5V',         from: 'ATX 5V',    to: 'Relay VCC' },
    { color: '#000000', label: 'GND',              from: 'ATX GND',   to: 'Relay GND' },
    { color: '#999999', label: 'NO → pump +',      from: 'Relay NO',  to: 'Pump positive terminal (12V switched)' },
    { color: '#000000', label: 'COM → 12V',        from: 'ATX 12V',   to: 'Relay COM' },
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

    if (!active) {
      svgEl.querySelectorAll<HTMLElement>('path, line, g[partID]').forEach(el => {
        el.style.opacity = '1';
        el.style.filter = '';
        el.style.transition = 'opacity 0.2s, filter 0.2s';
      });
      return;
    }

    const activeColors = new Set((COMPONENT_COLORS[active] || []).map(c => c.toLowerCase()));

    svgEl.querySelectorAll<HTMLElement>('path[stroke], line[stroke]').forEach(el => {
      const stroke = (el.getAttribute('stroke') || '').toLowerCase();
      const opacity = el.getAttribute('opacity') || '1';
      // skip the green fuzzy connector dots (opacity 0.2)
      if (parseFloat(opacity) < 0.5) return;
      const isActive = activeColors.has(stroke);
      el.style.transition = 'opacity 0.2s, filter 0.2s';
      el.style.opacity = isActive ? '1' : '0.06';
      el.style.filter = isActive ? `drop-shadow(0 0 3px ${stroke}) drop-shadow(0 0 6px ${stroke})` : '';
    });

    // Dim component bodies
    svgEl.querySelectorAll<HTMLElement>('g[partID]').forEach(el => {
      el.style.transition = 'opacity 0.2s';
      el.style.opacity = '0.2';
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
                      <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: w.color, border: w.color === '#000000' ? '1px solid #555' : 'none', flexShrink: 0 }} />
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