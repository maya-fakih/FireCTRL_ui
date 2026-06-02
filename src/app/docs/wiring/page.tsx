'use client';
import { useState, useEffect, useRef } from 'react';
import TopBar from '@/components/TopBar';
import { Cpu, Zap, Thermometer, Wind, Camera, Wrench } from 'lucide-react';

type CompId = 'atx'|'pi'|'amg'|'ads'|'mq2'|'servo1'|'servo2'|'pump'|'cam'|null;

// Wire colors per component — traced from Fritzing .fz connections
const COLORS: Record<string, string[]> = {
  atx:    ['#fff800','#ef6100','#cc1414','#404040'],
  pi:     ['#25cc35','#fff800','#ab58a2','#418dd9','#cc1414','#404040','#ef6100'],
  amg:    ['#cc1414','#404040','#25cc35','#fff800'],
  ads:    ['#cc1414','#404040','#25cc35','#fff800','#8c3b00'],
  mq2:    ['#cc1414','#ffffff','#8c3b00','#404040','#ef6100'],
  servo1: ['#cc1414','#404040','#fff800','#ab58a2'],
  servo2: ['#cc1414','#404040','#fff800','#418dd9'],
  pump:   ['#fff800','#cc1414','#404040','#ef6100'],
  cam:    [],
};

// partID → component key (from Fritzing parts list)
// multiple keys = this part lights up for multiple selections
const PID: Record<string, string[]> = {
  '854378390': ['pi','servo1','servo2','pump'],  // RPi5 — lights up when pi, servos, relay selected
  '854378850': ['servo1'],                        // servo_1
  '854378880': ['servo2'],                        // servo_2
  '854378920': ['ads'],                           // ADS1115
  '854378960': ['amg'],                           // AMG8833
  '854379440': ['pump'],                          // Relay
  '854380840': ['atx','pump'],                    // ATX PSU — lights up for atx AND relay
  '854386000': ['mq2'],                           // MQ-2
  '854392680': ['mq2'],                           // R1 — voltage divider for MQ-2
  '854400050': ['amg'],                           // R2 (20k) — for AMG8833
  '57900':     ['__breadboard'],                  // always bright
};

const COMPS = [
  { id:'atx',    label:'ATX PSU',        sub:'Power supply',           icon:Zap },
  { id:'pi',     label:'Raspberry Pi 5', sub:'GPIO + I²C',             icon:Cpu },
  { id:'amg',    label:'AMG8833',        sub:'Thermal cam — 0x69',     icon:Thermometer },
  { id:'ads',    label:'ADS1115',        sub:'ADC — 0x48',             icon:Cpu },
  { id:'mq2',    label:'MQ-2',           sub:'Gas sensor',             icon:Wind },
  { id:'servo1', label:'Servo 1 (Pan)',  sub:'GPIO12 — purple',        icon:Wrench },
  { id:'servo2', label:'Servo 2 (Tilt)', sub:'GPIO13 — blue',          icon:Wrench },
  { id:'pump',   label:'Relay',          sub:'GPIO17 — pump control',  icon:Zap },
  { id:'cam',    label:'IMX500',         sub:'CSI ribbon only',        icon:Camera },
] as const;

export default function WiringPage() {
  const [active, setActive] = useState<CompId>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/wiring_diagram.svg').then(r => r.text()).then(svg => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = svg;
      const el = containerRef.current.querySelector('svg');
      if (el) { el.style.width = '100%'; el.style.height = 'auto'; }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const groups  = svg.querySelectorAll<SVGGElement>('g[partID]');
    const strokes = svg.querySelectorAll<SVGElement>('path[stroke], line[stroke]');

    if (!active) {
      groups.forEach(g  => { g.style.opacity = '1'; g.style.transition = 'opacity 0.2s'; });
      strokes.forEach(s => { s.style.opacity = '';  s.style.transition = 'opacity 0.2s'; });
      return;
    }

    const activeColors = new Set(COLORS[active] ?? []);

    groups.forEach(g => {
      g.style.transition = 'opacity 0.2s';
      const pid = g.getAttribute('partID') ?? '';
      const owners = PID[pid] ?? [];
      if (owners.includes('__breadboard'))    g.style.opacity = '1';
      else if (owners.includes(active))       g.style.opacity = '1';
      else if (owners.length > 0)             g.style.opacity = '0.08';
      else {
        // wire group or unlabelled element — dim unless it contains an active-color stroke
        const hasMatch = [...g.querySelectorAll('[stroke]')]
          .some(e => activeColors.has((e.getAttribute('stroke') ?? '').toLowerCase()));
        g.style.opacity = hasMatch ? '1' : '0.08';
      }
    });

    strokes.forEach(s => {
      if (s.closest('g[partID]')) return; // handled above
      const col = (s.getAttribute('stroke') ?? '').toLowerCase();
      s.style.transition = 'opacity 0.2s';
      s.style.opacity = activeColors.has(col) ? '1' : '0.08';
    });
  }, [active, loaded]);

  return (
    <div>
      <TopBar title="Wiring" subtitle="FYP FireCTRL — hardware connections" />

      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
        {COMPS.map(c => {
          const Icon = c.icon;
          const on = active === c.id;
          return (
            <button key={c.id} onClick={() => setActive(on ? null : c.id as CompId)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
                borderRadius:8, cursor:'pointer', border:'none', transition:'all 0.15s',
                background: on ? 'var(--color-accent)' : 'var(--color-surface-secondary)',
                color: on ? '#fff' : 'var(--color-text-primary)',
                fontWeight: on ? 600 : 400 }}>
              <Icon size={14} />
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:13 }}>{c.label}</div>
                <div style={{ fontSize:10, opacity:0.7 }}>{c.sub}</div>
              </div>
            </button>
          );
        })}
        {active && (
          <button onClick={() => setActive(null)}
            style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', border:'none',
              background:'var(--color-surface-secondary)', color:'var(--color-text-secondary)', fontSize:13 }}>
            Clear ×
          </button>
        )}
      </div>

      <div className="card" style={{ padding:16, overflow:'auto' }}>
        {!loaded && <div style={{ color:'var(--color-text-muted)', padding:40, textAlign:'center', fontSize:13 }}>Loading…</div>}
        <div ref={containerRef} style={{ minWidth:600 }} />
      </div>

      {!active && (
        <div style={{ color:'var(--color-text-muted)', fontSize:13, textAlign:'center', padding:'16px 0' }}>
          Click a component to highlight its connections
        </div>
      )}
    </div>
  );
}