'use client';

import { useState, useEffect, useRef } from 'react';
import TopBar from '@/components/TopBar';
import { Cpu, Zap, Thermometer, Wind, Camera, Wrench } from 'lucide-react';

type ComponentId = 'pi' | 'atx' | 'amg' | 'ads' | 'mq2' | 'servo' | 'pump' | 'cam' | null;

// Wire colors per component — these match the actual SVG stroke colors
const COMPONENT_COLORS: Record<string, string[]> = {
  atx:   ['#8c0000', '#d6d63a', '#ad6a38', '#000000'],  // 5V dark red, SCL yellow-green, 3.3V orange, GND black
  amg:   ['#00a527', '#d6d63a', '#ad6a38', '#8c0000'],  // SDA green, SCL yellow-green, 3.3V orange, 5V
  ads:   ['#00a527', '#d6d63a', '#ad6a38', '#6c2710'],  // SDA, SCL, 3.3V, brown A0
  mq2:   ['#6c2710', '#8c0000', '#000000'],              // brown A0, 5V dark red, GND
  servo: ['#ffff00', '#ff0000', '#000000'],              // yellow signal, red 5V, black GND
  pump:  ['#7a3a73', '#8c0000', '#000000', '#999999'],   // purple relay signal, 5V, GND, grey
  pi:    ['#00a527', '#d6d63a', '#7a3a73', '#1b5bb3', '#ad6a38', '#8c0000', '#000000'],
  cam:   [],
};

const COMPONENTS = [
  { id: 'atx',   label: 'ATX PSU',    sub: '12V / 5V / 3.3V rails', icon: Zap },
  { id: 'pi',    label: 'Raspberry Pi 5', sub: 'GPIO + I2C + power', icon: Cpu },
  { id: 'amg',   label: 'AMG8833',    sub: '8×8 thermal — I2C 0x69', icon: Thermometer },
  { id: 'ads',   label: 'ADS1115',    sub: '16-bit ADC — I2C 0x48', icon: Cpu },
  { id: 'mq2',   label: 'MQ-2',       sub: 'Gas sensor — analog', icon: Wind },
  { id: 'servo', label: 'Servos',     sub: 'Pan GPIO27 / Tilt GPIO22', icon: Wrench },
  { id: 'pump',  label: 'Pump + Relay', sub: 'GPIO17 → HW-482 → 12V pump', icon: Zap },
  { id: 'cam',   label: 'IMX500',     sub: 'CSI ribbon — no GPIO', icon: Camera },
] as const;

const WIRE_TABLE: Record<string, { from: string; to: string; color: string; label: string }[]> = {
  atx: [
    { color: '#ffff00', label: '12V yellow',   from: 'ATX 12V', to: 'Pump relay COM' },
    { color: '#cc3300', label: '5V red',        from: 'ATX 5V',  to: 'Pi Pin 2+4, Servos, MQ-2 H+A' },
    { color: '#dd6600', label: '3.3V orange',   from: 'ATX 3.3V',to: 'AMG8833 VIN, ADS1115 VDD' },
    { color: '#444',    label: 'GND black',     from: 'ATX GND', to: 'Pi Pin 6+9, all sensor GNDs' },
  ],
  pi: [
    { color: '#22aa44', label: 'SDA (Pin 3)',   from: 'Pi GPIO2',  to: 'Breadboard SDA bus row 36' },
    { color: '#ccaa00', label: 'SCL (Pin 5)',   from: 'Pi GPIO3',  to: 'Breadboard SCL bus row 38' },
    { color: '#7a3a73', label: 'GPIO17 (Pin 11)',from: 'Pi GPIO17', to: 'Relay IN pin' },
    { color: '#1b5bb3', label: 'GPIO27 (Pin 13)',from: 'Pi GPIO27', to: 'Pan servo signal' },
    { color: '#1b5bb3', label: 'GPIO22 (Pin 15)',from: 'Pi GPIO22', to: 'Tilt servo signal' },
    { color: '#cc3300', label: '5V (Pin 2+4)',  from: 'ATX 5V',    to: 'Pi power input' },
    { color: '#444',    label: 'GND (Pin 6+9)', from: 'ATX GND',   to: 'Pi ground' },
  ],
  amg: [
    { color: '#cc3300', label: 'VIN → 3.3V',   from: 'ATX 3.3V',  to: 'AMG8833 VIN' },
    { color: '#444',    label: 'GND',           from: 'ATX GND',   to: 'AMG8833 GND' },
    { color: '#ccaa00', label: 'SCL → row 38',  from: 'AMG8833 SCL', to: 'Breadboard SCL bus' },
    { color: '#22aa44', label: 'SDA → row 36',  from: 'AMG8833 SDA', to: 'Breadboard SDA bus' },
  ],
  ads: [
    { color: '#dd6600', label: 'VDD → 3.3V',   from: 'ATX 3.3V',   to: 'ADS1115 VDD' },
    { color: '#444',    label: 'GND',           from: 'ATX GND',    to: 'ADS1115 GND' },
    { color: '#ccaa00', label: 'SCL → row 38',  from: 'ADS1115 SCL', to: 'Breadboard SCL bus' },
    { color: '#22aa44', label: 'SDA → row 36',  from: 'ADS1115 SDA', to: 'Breadboard SDA bus' },
    { color: '#8B4513', label: 'ADDR → GND',    from: 'ADS1115 ADDR', to: 'GND → sets 0x48' },
    { color: '#888',    label: 'A0 → divider',  from: 'ADS1115 A0',  to: 'MQ-2 voltage divider junction' },
  ],
  mq2: [
    { color: '#cc3300', label: 'H + A → 5V',   from: 'ATX 5V',    to: 'MQ-2 H pins + A pins' },
    { color: '#444',    label: 'B → GND',       from: 'MQ-2 B pin', to: 'Resistor → GND' },
    { color: '#888',    label: 'Divider out',   from: 'Resistor junction', to: 'ADS1115 A0' },
  ],
  servo: [
    { color: '#cc3300', label: 'Red → 5V',      from: 'ATX 5V',    to: 'Servo 1 + 2 VCC' },
    { color: '#444',    label: 'Black → GND',   from: 'ATX GND',   to: 'Servo 1 + 2 GND' },
    { color: '#ccaa00', label: 'Yellow → GPIO27', from: 'Pi GPIO27', to: 'Pan servo signal' },
    { color: '#ccaa00', label: 'Yellow → GPIO22', from: 'Pi GPIO22', to: 'Tilt servo signal' },
  ],
  pump: [
    { color: '#7a3a73', label: 'IN → GPIO17',   from: 'Pi GPIO17',  to: 'HW-482 relay IN' },
    { color: '#cc3300', label: 'VCC → 5V',      from: 'ATX 5V',    to: 'Relay VCC' },
    { color: '#444',    label: 'GND',           from: 'ATX GND',   to: 'Relay GND' },
    { color: '#ffff00', label: 'COM → 12V',     from: 'ATX 12V',   to: 'Relay COM' },
    { color: '#444',    label: 'NO → pump +',   from: 'Relay NO',  to: 'Pump positive terminal' },
    { color: '#444',    label: 'Pump – → GND',  from: 'Pump GND',  to: 'ATX GND' },
  ],
  cam: [
    { color: '#888', label: 'CSI ribbon', from: 'IMX500 CSI connector', to: 'Pi 5 CAM0 port' },
  ],
};

export default function WiringPage() {
  const [active, setActive] = useState<ComponentId>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);

  // Load SVG inline so we can manipulate it
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
            svgEl.style.transition = 'all 0.2s';
          }
          setSvgLoaded(true);
        }
      });
  }, []);

  // Apply highlight when active component changes
  useEffect(() => {
    if (!svgLoaded || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;

    if (!active) {
      // Reset all
      svgEl.querySelectorAll('path, line, g[partID]').forEach((el: Element) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.filter = '';
      });
      return;
    }

    const activeColors = COMPONENT_COLORS[active] || [];

    // Dim everything
    svgEl.querySelectorAll('path[stroke], line[stroke]').forEach((el: Element) => {
      const stroke = el.getAttribute('stroke') || '';
      const isActive = activeColors.some(c => stroke.toLowerCase() === c.toLowerCase());
      (el as HTMLElement).style.opacity = isActive ? '1' : '0.08';
      (el as HTMLElement).style.filter = isActive ? 'drop-shadow(0 0 4px ' + stroke + ')' : '';
    });

    // Dim component bodies that are not related
    svgEl.querySelectorAll('g[partID]').forEach((el: Element) => {
      (el as HTMLElement).style.opacity = '0.25';
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
            style={{
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: 'none',
              background: 'var(--color-surface-secondary)', color: 'var(--color-text-secondary)',
              fontSize: 13,
            }}
          >
            Clear ×
          </button>
        )}
      </div>

      {/* Fritzing SVG diagram */}
      <div className="card" style={{ padding: 16, marginBottom: 24, overflow: 'auto' }}>
        {!svgLoaded && (
          <div style={{ color: 'var(--color-text-muted)', padding: 40, textAlign: 'center', fontSize: 13 }}>
            Loading diagram...
          </div>
        )}
        <div ref={svgContainerRef} style={{ minWidth: 600 }} />
      </div>

      {/* Wire table for active component */}
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
                  <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: w.color, flexShrink: 0 }} />
                    {w.label}
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