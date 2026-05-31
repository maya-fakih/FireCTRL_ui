'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { Cpu, Zap, Thermometer, Wind, Camera, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────
type ComponentId = 'pi' | 'atx' | 'amg' | 'ads' | 'mq2' | 'servo' | 'pump' | 'cam';

interface WireSpec {
  color: string;
  label: string;
  from: string;
  to: string;
}

interface ComponentSpec {
  id: ComponentId;
  label: string;
  sub: string;
  icon: React.ElementType;
  i2cAddr?: string;
  wires: WireSpec[];
  note?: string;
}

// ─── data ─────────────────────────────────────────────────────────────────────
const COMPONENTS: ComponentSpec[] = [
  {
    id: 'atx',
    label: 'ATX PSU',
    sub: 'LG 450W — 5V @ 30A',
    icon: Zap,
    wires: [
      { color: '#cc3300', label: 'Red',   from: '5V rail',  to: 'Pi Pin 2 (5V)' },
      { color: '#444',    label: 'Black', from: 'GND rail', to: 'Pi Pin 6 (GND)' },
      { color: '#cc3300', label: 'Red',   from: '5V rail',  to: 'Servo 5V (direct)' },
      { color: '#444',    label: 'Black', from: 'GND rail', to: 'Servo GND (shared)' },
      { color: '#cc3300', label: 'Red',   from: '5V rail',  to: 'MQ2 heater + A pin' },
      { color: '#444',    label: 'Black', from: 'GND rail', to: 'MQ2 GND + resistor leg' },
    ],
    note: 'PS_ON (green wire) must be shorted to GND on the 24-pin connector to run standalone.',
  },
  {
    id: 'amg',
    label: 'AMG8833',
    sub: '8×8 thermal grid',
    icon: Thermometer,
    i2cAddr: '0x69',
    wires: [
      { color: '#cc3300', label: 'Red (VIN)',    from: 'Pi Pin 1',  to: '3.3V' },
      { color: '#444',    label: 'Black (GND)',  from: 'Pi Pin 9',  to: 'GND' },
      { color: '#ccaa00', label: 'Yellow (SCL)', from: 'Pi Pin 5',  to: 'SCL' },
      { color: '#22aa44', label: 'Green (SDA)',  from: 'Pi Pin 3',  to: 'SDA' },
    ],
    note: 'ADO pin left floating → I2C address 0x69. INT pin not connected.',
  },
  {
    id: 'ads',
    label: 'ADS1115',
    sub: '16-bit ADC + PGA',
    icon: Cpu,
    i2cAddr: '0x48',
    wires: [
      { color: '#dd6600', label: 'Orange (VDD)',  from: 'Pi Pin 1',  to: '3.3V' },
      { color: '#cc3300', label: 'Red (GND)',     from: 'Pi Pin 9',  to: 'GND' },
      { color: '#8B4513', label: 'Brown (SCL)',   from: 'Pi Pin 5',  to: 'SCL — shared I2C' },
      { color: '#444',    label: 'Black (SDA)',   from: 'Pi Pin 3',  to: 'SDA — shared I2C' },
      { color: '#ddd',    label: 'White (ADDR)',  from: 'ADDR pin',  to: 'GND → sets 0x48' },
      { color: '#888',    label: 'Grey (A0)',     from: 'A0 pin',    to: 'MQ2 voltage divider junction' },
    ],
    note: 'ADDR to GND gives 0x48. ALRT pin not connected. Update config: RL = 8200.',
  },
  {
    id: 'mq2',
    label: 'MQ2 sensor',
    sub: 'Bare 6-pin element',
    icon: Wind,
    wires: [
      { color: '#dd7700', label: 'Orange (H left)',  from: 'Left col top',    to: 'ATX 5V — heater' },
      { color: '#444',    label: 'Black (H mid)',    from: 'Left col mid',    to: 'ATX GND — heater' },
      { color: '#8B4513', label: 'Brown (A pin)',    from: 'Left col bot',    to: 'ATX 5V — sense side' },
      { color: '#ddd',    label: 'White (B pin)',    from: 'Right col top',   to: 'Breadboard junction + 8.2kΩ to GND' },
      { color: '#cc3300', label: 'Red (B side)',     from: 'Right col mid',   to: 'ATX GND' },
    ],
    note: 'Junction between White (B pin) and 8.2kΩ resistor feeds ADS1115 A0. Right col bottom pin = empty.',
  },
  {
    id: 'servo',
    label: 'Servos ×2',
    sub: 'Pan (GPIO 27) + Tilt (GPIO 22)',
    icon: Wrench,
    wires: [
      { color: '#ccaa00', label: 'Yellow (signal pan)',  from: 'Pi GPIO 27', to: 'Pan servo signal' },
      { color: '#ccaa00', label: 'Yellow (signal tilt)', from: 'Pi GPIO 22', to: 'Tilt servo signal' },
      { color: '#cc3300', label: 'Red (5V)',             from: 'ATX 5V',     to: 'Both servo VCC — not from Pi' },
      { color: '#8B4513', label: 'Brown (GND)',          from: 'ATX GND',    to: 'Both servo GND — shared with Pi GND' },
    ],
    note: 'Signal from Pi GPIO, power from ATX directly. Shared GND is critical — without it PWM signal has no reference.',
  },
  {
    id: 'pump',
    label: 'Water pump',
    sub: 'GPIO 17 control',
    icon: Zap,
    wires: [
      { color: '#aa66ff', label: 'Purple (signal)', from: 'Pi GPIO 17', to: 'Pump relay/transistor signal' },
      { color: '#cc3300', label: 'Red (5V)',         from: 'ATX 5V',    to: 'Pump power' },
      { color: '#444',    label: 'Black (GND)',      from: 'ATX GND',   to: 'Pump GND — shared rail' },
    ],
    note: 'GPIO 17 drives a relay or transistor — do not connect pump motor directly to GPIO pin.',
  },
  {
    id: 'cam',
    label: 'Pi camera',
    sub: 'AI inference camera',
    icon: Camera,
    wires: [
      { color: '#cc8844', label: 'Ribbon cable', from: 'CSI port on Pi', to: 'Camera connector — contacts face board' },
    ],
    note: 'Not a GPIO connection. Lift the CSI latch, insert ribbon with contacts facing the USB ports, push latch down.',
  },
];

const PIN_TABLE = [
  { pin: 1,  name: '3.3V',     use: 'AMG8833 VIN + ADS1115 VDD',       color: '#cc3300' },
  { pin: 2,  name: '5V',       use: 'ATX 5V power input',               color: '#cc3300' },
  { pin: 3,  name: 'SDA',      use: 'I2C data — AMG8833 + ADS1115',     color: '#22aa44' },
  { pin: 5,  name: 'SCL',      use: 'I2C clock — AMG8833 + ADS1115',    color: '#ccaa00' },
  { pin: 6,  name: 'GND',      use: 'ATX GND power input',              color: '#666' },
  { pin: 9,  name: 'GND',      use: 'Sensor GND (AMG + ADS)',           color: '#666' },
  { pin: 17, name: 'GPIO 17',  use: 'Pump relay signal',                color: '#aa66ff' },
  { pin: 22, name: 'GPIO 22',  use: 'Servo tilt signal',                color: '#ccaa00' },
  { pin: 27, name: 'GPIO 27',  use: 'Servo pan signal',                 color: '#ccaa00' },
];

const CHECKLIST = [
  'All GNDs tied together — Pi, servos, pump, MQ2, all share ATX GND rail',
  'ADS1115 and AMG8833 on 3.3V only — never 5V',
  'MQ2 heater and A pin on ATX 5V — not Pi 3.3V',
  'Servo power from ATX 5V directly — not from Pi GPIO 5V pin',
  'ADS1115 ADDR pin connected to GND (gives 0x48)',
  '8.2kΩ resistor between MQ2 B-pin and GND, junction wired to ADS A0',
  'config.json RL updated to 8200',
  'usb_max_current_enable=1 in /boot/firmware/config.txt',
  'After power on: i2cdetect -y 1 → should show 0x48 and 0x69',
];

// ─── Dot ──────────────────────────────────────────────────────────────────────
function WireDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        marginRight: 8,
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    />
  );
}

// ─── SVG diagram ──────────────────────────────────────────────────────────────
function WiringDiagram({ active }: { active: ComponentId | null }) {
  const dim = (id: ComponentId) =>
    active !== null && active !== id && active !== 'pi'
      ? 0.18
      : 1;

  return (
    <svg
      width="100%"
      viewBox="0 0 680 460"
      style={{ display: 'block', borderRadius: 8, background: '#161210' }}
      aria-label="Wiring diagram"
    >
      {/* Pi board */}
      <g opacity={1}>
        <rect x="230" y="30" width="220" height="270" rx="10" fill="#1e3a1a" stroke="#2d5c28" strokeWidth="1.5" />
        <text x="340" y="52" textAnchor="middle" fill="#6ab85a" fontSize="12" fontWeight="600" fontFamily="DM Sans, sans-serif">Raspberry Pi 5</text>
        {/* pins */}
        {[
          { y: 80,  label: 'Pin 1 · 3.3V',    dot: '#cc3300' },
          { y: 98,  label: 'Pin 2 · 5V',       dot: '#cc3300' },
          { y: 116, label: 'Pin 3 · SDA',      dot: '#22aa44' },
          { y: 134, label: 'Pin 5 · SCL',      dot: '#ccaa00' },
          { y: 152, label: 'Pin 6 · GND',      dot: '#555' },
          { y: 170, label: 'Pin 9 · GND',      dot: '#555' },
          { y: 200, label: 'GPIO 17 · pump',   dot: '#aa66ff' },
          { y: 220, label: 'GPIO 22 · tilt',   dot: '#ccaa00' },
          { y: 240, label: 'GPIO 27 · pan',    dot: '#ccaa00' },
          { y: 270, label: 'CSI · camera',     dot: '#cc8844' },
        ].map(p => (
          <g key={p.y}>
            <circle cx="238" cy={p.y - 3} r="3.5" fill={p.dot} />
            <text x="247" y={p.y} fontSize="9" fill="#7aaa72" fontFamily="DM Sans, sans-serif">{p.label}</text>
          </g>
        ))}
      </g>

      {/* ATX PSU */}
      <g opacity={dim('atx')}>
        <rect x="20" y="40" width="140" height="70" rx="6" fill="#2a2826" stroke="#4a4442" strokeWidth="1" />
        <text x="90" y="65" textAnchor="middle" fill="#EDE8E2" fontSize="12" fontWeight="600" fontFamily="DM Sans, sans-serif">ATX PSU</text>
        <text x="90" y="82" textAnchor="middle" fill="#6E6660" fontSize="9" fontFamily="DM Sans, sans-serif">LG 450W · 5V @ 30A</text>
        <circle cx="50" cy="100" r="4" fill="#cc3300" />
        <text x="60" y="103" fontSize="8" fill="#A59E97" fontFamily="DM Sans, sans-serif">5V</text>
        <circle cx="90" cy="100" r="4" fill="#444" stroke="#666" strokeWidth="0.5" />
        <text x="100" y="103" fontSize="8" fill="#A59E97" fontFamily="DM Sans, sans-serif">GND</text>
        {/* wires to Pi */}
        <path d="M55 100 L55 98 L230 98" fill="none" stroke="#cc3300" strokeWidth="1.5" opacity={active === 'atx' ? 1 : 0.5} />
        <path d="M94 100 L94 152 L230 152" fill="none" stroke="#444" strokeWidth="1.5" opacity={active === 'atx' ? 1 : 0.4} />
      </g>

      {/* AMG8833 */}
      <g opacity={dim('amg')}>
        <rect x="490" y="30" width="170" height="120" rx="6" fill="#1a2438" stroke="#2a3a5a" strokeWidth="1" />
        <text x="575" y="52" textAnchor="middle" fill="#EDE8E2" fontSize="12" fontWeight="600" fontFamily="DM Sans, sans-serif">AMG8833</text>
        <text x="575" y="67" textAnchor="middle" fill="#6E6660" fontSize="9" fontFamily="DM Sans, sans-serif">8×8 thermal · 0x69</text>
        {[
          { cy: 85,  col: '#cc3300', txt: 'VIN (red)' },
          { cy: 100, col: '#444',    txt: 'GND (black)' },
          { cy: 115, col: '#ccaa00', txt: 'SCL (yellow)' },
          { cy: 130, col: '#22aa44', txt: 'SDA (green)' },
        ].map(p => (
          <g key={p.cy}>
            <circle cx="498" cy={p.cy} r="3" fill={p.col} />
            <text x="506" y={p.cy + 3} fontSize="8" fill="#A59E97" fontFamily="DM Sans, sans-serif">{p.txt}</text>
          </g>
        ))}
        {/* I2C wires */}
        <path d="M494 85 L460 85 L460 80 L450 80" fill="none" stroke="#cc3300" strokeWidth="1.2" opacity={active === 'amg' ? 1 : 0.45} />
        <path d="M494 100 L455 100 L455 170 L450 170" fill="none" stroke="#555" strokeWidth="1.2" opacity={active === 'amg' ? 1 : 0.35} />
        <path d="M494 115 L462 115 L462 134 L450 134" fill="none" stroke="#ccaa00" strokeWidth="1.2" opacity={active === 'amg' ? 1 : 0.4} />
        <path d="M494 130 L458 130 L458 116 L450 116" fill="none" stroke="#22aa44" strokeWidth="1.2" opacity={active === 'amg' ? 1 : 0.4} />
      </g>

      {/* ADS1115 */}
      <g opacity={dim('ads')}>
        <rect x="490" y="180" width="170" height="150" rx="6" fill="#1a2438" stroke="#2a3a5a" strokeWidth="1" />
        <text x="575" y="200" textAnchor="middle" fill="#EDE8E2" fontSize="12" fontWeight="600" fontFamily="DM Sans, sans-serif">ADS1115</text>
        <text x="575" y="215" textAnchor="middle" fill="#6E6660" fontSize="9" fontFamily="DM Sans, sans-serif">16-bit ADC · 0x48</text>
        {[
          { cy: 232, col: '#dd6600', txt: 'VDD (orange)' },
          { cy: 247, col: '#cc3300', txt: 'GND (red wire)' },
          { cy: 262, col: '#8B4513', txt: 'SCL (brown)' },
          { cy: 277, col: '#444',    txt: 'SDA (black)' },
          { cy: 292, col: '#ddd',    txt: 'ADDR→GND (white)' },
          { cy: 307, col: '#888',    txt: 'A0 ← MQ2 (grey)' },
        ].map(p => (
          <g key={p.cy}>
            <circle cx="498" cy={p.cy} r="3" fill={p.col} stroke={p.col === '#ddd' ? '#999' : 'none'} />
            <text x="506" y={p.cy + 3} fontSize="8" fill="#A59E97" fontFamily="DM Sans, sans-serif">{p.txt}</text>
          </g>
        ))}
        {/* wires */}
        <path d="M494 232 L468 232 L468 80 L450 80" fill="none" stroke="#dd6600" strokeWidth="1.2" opacity={active === 'ads' ? 1 : 0.4} />
        <path d="M494 247 L464 247 L464 170 L450 170" fill="none" stroke="#cc3300" strokeWidth="1.2" opacity={active === 'ads' ? 1 : 0.35} />
        <path d="M494 262 L466 262 L466 134 L450 134" fill="none" stroke="#8B4513" strokeWidth="1.2" opacity={active === 'ads' ? 1 : 0.35} />
        <path d="M494 277 L463 277 L463 116 L450 116" fill="none" stroke="#555" strokeWidth="1.2" opacity={active === 'ads' ? 1 : 0.35} />
      </g>

      {/* MQ2 + breadboard */}
      <g opacity={dim('mq2')}>
        <rect x="20" y="220" width="190" height="170" rx="6" fill="#2a2618" stroke="#4a4228" strokeWidth="1" />
        <text x="115" y="242" textAnchor="middle" fill="#EDE8E2" fontSize="11" fontWeight="600" fontFamily="DM Sans, sans-serif">MQ2 + breadboard</text>
        <ellipse cx="75" cy="300" rx="24" ry="24" fill="#3a3830" stroke="#5a5648" strokeWidth="1" />
        <ellipse cx="75" cy="300" rx="16" ry="16" fill="#4a4840" stroke="#6a6658" strokeWidth="0.5" />
        <circle cx="75" cy="300" r="6" fill="#5a5850" />
        <text x="75" y="336" textAnchor="middle" fontSize="10" fontWeight="600" fill="#A59E97" fontFamily="DM Sans, sans-serif">MQ2</text>
        {/* resistor */}
        <path d="M115 300 L130 300 L133 292 L139 308 L145 292 L151 308 L157 292 L160 300 L175 300" fill="none" stroke="#aa66cc" strokeWidth="2" />
        <text x="147" y="288" textAnchor="middle" fontSize="8" fill="#aa66cc" fontFamily="DM Sans, sans-serif">8.2kΩ</text>
        <circle cx="115" cy="300" r="4" fill="#E05A2B" />
        <text x="115" y="318" textAnchor="middle" fontSize="7" fill="#6E6660" fontFamily="DM Sans, sans-serif">junction → A0</text>
        <line x1="175" x2="175" y1="300" y2="375" stroke="#555" strokeWidth="1.5" />
        <text x="182" y="368" fontSize="7" fill="#6E6660" fontFamily="DM Sans, sans-serif">to GND</text>
        {/* wire to ADS A0 */}
        <path d="M115 296 L115 200 L490 200 L490 307" fill="none" stroke="#888" strokeWidth="1.2" strokeDasharray="4 3" opacity={active === 'mq2' ? 1 : 0.4} />
      </g>

      {/* Servos */}
      <g opacity={dim('servo')}>
        <rect x="230" y="370" width="100" height="75" rx="6" fill="#222" stroke="#3a3a3a" strokeWidth="1" />
        <text x="280" y="390" textAnchor="middle" fill="#EDE8E2" fontSize="10" fontWeight="600" fontFamily="DM Sans, sans-serif">Servo pan</text>
        <text x="280" y="403" textAnchor="middle" fill="#6E6660" fontSize="8" fontFamily="DM Sans, sans-serif">GPIO 27</text>
        <circle cx="240" cy="420" r="3" fill="#ccaa00" />
        <circle cx="260" cy="420" r="3" fill="#cc3300" />
        <circle cx="280" cy="420" r="3" fill="#8B4513" />
        <path d="M240 417 L240 240 L230 240" fill="none" stroke="#ccaa00" strokeWidth="1.2" opacity={active === 'servo' ? 1 : 0.4} />

        <rect x="350" y="370" width="100" height="75" rx="6" fill="#222" stroke="#3a3a3a" strokeWidth="1" />
        <text x="400" y="390" textAnchor="middle" fill="#EDE8E2" fontSize="10" fontWeight="600" fontFamily="DM Sans, sans-serif">Servo tilt</text>
        <text x="400" y="403" textAnchor="middle" fill="#6E6660" fontSize="8" fontFamily="DM Sans, sans-serif">GPIO 22</text>
        <circle cx="360" cy="420" r="3" fill="#ccaa00" />
        <circle cx="380" cy="420" r="3" fill="#cc3300" />
        <circle cx="400" cy="420" r="3" fill="#8B4513" />
        <path d="M360 417 L360 220 L450 220" fill="none" stroke="#ccaa00" strokeWidth="1.2" opacity={active === 'servo' ? 1 : 0.4} />
      </g>

      {/* Pump */}
      <g opacity={dim('pump')}>
        <circle cx="570" cy="400" r="32" fill="#222" stroke="#3a3a3a" strokeWidth="1" />
        <circle cx="570" cy="400" r="22" fill="#2a2a2a" stroke="#444" strokeWidth="0.5" />
        <text x="570" y="405" textAnchor="middle" fill="#EDE8E2" fontSize="14" fontWeight="600" fontFamily="DM Sans, sans-serif">M</text>
        <text x="570" y="443" textAnchor="middle" fill="#6E6660" fontSize="9" fontFamily="DM Sans, sans-serif">Pump · GPIO 17</text>
        <path d="M570 368 L570 300 L450 300 L450 200" fill="none" stroke="#aa66ff" strokeWidth="1.2" opacity={active === 'pump' ? 1 : 0.35} />
      </g>

      {/* Camera */}
      <g opacity={dim('cam')}>
        <rect x="490" y="360" width="80" height="50" rx="6" fill="#1e1e22" stroke="#3a3a44" strokeWidth="1" />
        <circle cx="530" cy="385" r="14" fill="#151518" stroke="#3a3a44" strokeWidth="0.5" />
        <circle cx="530" cy="385" r="8" fill="#1a1a2a" />
        <circle cx="530" cy="385" r="3" fill="#222234" />
        <text x="530" y="422" textAnchor="middle" fill="#6E6660" fontSize="9" fontFamily="DM Sans, sans-serif">Pi camera · CSI</text>
        <path d="M510 360 L510 310 L450 310 L450 270" fill="none" stroke="#cc8844" strokeWidth="2.5" strokeDasharray="5 3" opacity={active === 'cam' ? 1 : 0.35} />
      </g>

      {/* Common GND note */}
      <rect x="155" y="410" width="68" height="28" rx="4" fill="rgba(224,90,43,0.1)" stroke="#E05A2B" strokeWidth="0.5" />
      <text x="189" y="422" textAnchor="middle" fontSize="7" fill="#E05A2B" fontFamily="DM Sans, sans-serif" fontWeight="600">⚠ common</text>
      <text x="189" y="433" textAnchor="middle" fontSize="7" fill="#E05A2B" fontFamily="DM Sans, sans-serif">GND rail</text>
    </svg>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function WiringPage() {
  const [active, setActive] = useState<ComponentId | null>(null);
  const [checked, setChecked] = useState<boolean[]>(Array(CHECKLIST.length).fill(false));

  const toggleCheck = (i: number) => {
    setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const allDone = checked.every(Boolean);
  const activeComp = active ? COMPONENTS.find(c => c.id === active) : null;

  return (
    <div>
      <TopBar
        title="Wiring & GPIO"
        subtitle="Full connection guide — click any component to inspect its wiring"
      />

      {/* ── diagram + inspector ── */}
      <div className="flex gap-5 mb-6" style={{ alignItems: 'flex-start' }}>
        {/* diagram */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <WiringDiagram active={active} />
          {/* component filter buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {COMPONENTS.map(c => {
              const Icon = c.icon;
              const isActive = active === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(isActive ? null : c.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all"
                  style={{
                    background: isActive ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    fontFamily: 'inherit',
                  }}
                >
                  <Icon size={12} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* inspector panel */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px',
            minHeight: 340,
          }}
        >
          {activeComp ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <activeComp.icon size={15} color="var(--accent)" />
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {activeComp.label}
                </span>
                {activeComp.i2cAddr && (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {activeComp.i2cAddr}
                  </span>
                )}
              </div>
              <div className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
                {activeComp.sub}
              </div>

              <div className="flex flex-col gap-2">
                {activeComp.wires.map((w, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-0.5 px-3 py-2 rounded-lg"
                    style={{ background: 'var(--bg-elevated)', borderLeft: `3px solid ${w.color}` }}
                  >
                    <div className="flex items-center gap-1.5">
                      <WireDot color={w.color} />
                      <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {w.label}
                      </span>
                    </div>
                    <div className="text-[10px] pl-4" style={{ color: 'var(--text-muted)' }}>
                      {w.from} → {w.to}
                    </div>
                  </div>
                ))}
              </div>

              {activeComp.note && (
                <div
                  className="mt-4 p-3 rounded-lg text-[11px]"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {activeComp.note}
                </div>
              )}
            </>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-full text-center gap-3"
              style={{ color: 'var(--text-muted)', minHeight: 280 }}
            >
              <Cpu size={28} strokeWidth={1.2} />
              <div className="text-[12px]">
                Click a component button or select one above to inspect its wiring
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── GPIO pin table ── */}
      <div className="card p-5 mb-5">
        <div className="text-[12px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          GPIO pin usage
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Pin', 'Name', 'Connected to'].map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '6px 12px',
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PIN_TABLE.map(row => (
                <tr
                  key={row.pin}
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      className="font-mono text-[11px] px-2 py-0.5 rounded"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    >
                      {row.pin}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    <span className="flex items-center gap-2">
                      <WireDot color={row.color} />
                      <span style={{ color: 'var(--text-primary)' }}>{row.name}</span>
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>
                    {row.use}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── pre-power checklist ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[12px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Pre-power checklist
          </div>
          {allDone && (
            <span
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full"
              style={{ background: 'var(--success-soft)', color: 'var(--success-text)' }}
            >
              <CheckCircle2 size={12} /> Ready to power on
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {CHECKLIST.map((item, i) => (
            <label
              key={i}
              className="flex items-start gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-colors"
              style={{
                background: checked[i] ? 'var(--success-soft)' : 'var(--bg-elevated)',
                border: `1px solid ${checked[i] ? 'rgba(58,125,92,0.25)' : 'var(--border-subtle)'}`,
              }}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggleCheck(i)}
                style={{ marginTop: 1, accentColor: 'var(--success-text)', flexShrink: 0 }}
              />
              <span
                className="text-[12px]"
                style={{
                  color: checked[i] ? 'var(--success-text)' : 'var(--text-secondary)',
                  textDecoration: checked[i] ? 'none' : 'none',
                  lineHeight: 1.5,
                }}
              >
                {item}
              </span>
            </label>
          ))}
        </div>

        <div
          className="mt-4 p-3 rounded-lg flex items-start gap-2 text-[11px]"
          style={{ background: 'var(--warning-soft)', color: 'var(--text-secondary)', lineHeight: 1.6 }}
        >
          <AlertTriangle size={13} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          Always wire with the PSU off. Connect GND before 5V. When powering on via GPIO, press
          the Pi&apos;s physical power button after connecting the ATX — cold GPIO boot needs a manual trigger.
        </div>
      </div>
    </div>
  );
}