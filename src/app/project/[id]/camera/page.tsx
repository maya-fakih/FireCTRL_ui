// src/app/project/[id]/camera/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import TopBar from '@/components/TopBar';
import { getCameraFeedUrl, getCameraSnapshotUrl, toggleCamera, getState } from '@/lib/api';
import { Camera, Download, Power, FlipVertical, Loader2 } from 'lucide-react';

// ── Heat matrix helpers ──────────────────────────────────────────────
function tempToColor(val: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
  // cool blue → yellow → hot red
  if (t < 0.5) {
    const r = Math.round(t * 2 * 255);
    const g = Math.round(t * 2 * 255);
    return `rgb(${r},${g},255)`;
  } else {
    const s = (t - 0.5) * 2;
    const r = 255;
    const g = Math.round((1 - s) * 255);
    return `rgb(${r},${g},0)`;
  }
}

function HeatMatrix({ matrix }: { matrix: number[][] }) {
  if (!matrix || matrix.length === 0) return null;

  const rows = matrix.length;
  const cols = matrix[0].length;

  // find min/max for color scale
  let min = Infinity, max = -Infinity;
  let hotRow = 0, hotCol = 0;
  matrix.forEach((row, r) => row.forEach((val, c) => {
    if (val < min) min = val;
    if (val > max) { max = val; hotRow = r; hotCol = c; }
  }));

  // compute err_x, err_y exactly as arm_controller does
  const cx = (cols - 1) / 2.0;
  const cy = (rows - 1) / 2.0;
  const errX = cx > 0 ? (hotCol - cx) / cx : 0;
  const errY = cy > 0 ? (hotRow - cy) / cy : 0;

  const cellSize = 36;
  const W = cols * cellSize;
  const H = rows * cellSize;

  return (
    <div>
      {/* grid */}
      <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
        {matrix.map((row, r) =>
          row.map((val, c) => {
            const isHot = r === hotRow && c === hotCol;
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  position: 'absolute',
                  left: c * cellSize,
                  top: r * cellSize,
                  width: cellSize,
                  height: cellSize,
                  background: tempToColor(val, min, max),
                  border: isHot ? '2px solid white' : '1px solid rgba(0,0,0,0.15)',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: isHot ? 700 : 400,
                  color: val > (min + max) / 2 ? '#000' : '#fff',
                }}
              >
                {val.toFixed(0)}
              </div>
            );
          })
        )}
        {/* crosshair at center */}
        <div style={{
          position: 'absolute',
          left: cx * cellSize + cellSize / 2 - 0.5,
          top: 0, width: 1, height: H,
          background: 'rgba(255,255,255,0.3)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: cy * cellSize + cellSize / 2 - 0.5,
          left: 0, height: 1, width: W,
          background: 'rgba(255,255,255,0.3)', pointerEvents: 'none'
        }} />
      </div>

      {/* axis labels */}
      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)', width: W, margin: '4px auto 0' }}>
        <span>← col 0</span>
        <span>col {cols-1} →</span>
      </div>

      {/* error + hotspot info */}
      <div className="mt-3 grid grid-cols-2 gap-2" style={{ width: W, margin: '8px auto 0' }}>
        <div className="card p-2 text-center">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>err_x (pan)</div>
          <div className="font-mono font-bold" style={{
            fontSize: 18,
            color: Math.abs(errX) < 0.15 ? 'var(--success)' : errX > 0 ? '#f97316' : '#60a5fa'
          }}>
            {errX > 0 ? '+' : ''}{errX.toFixed(3)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {Math.abs(errX) < 0.15 ? '✓ centered' : errX > 0 ? '→ fire right' : '← fire left'}
          </div>
        </div>
        <div className="card p-2 text-center">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>err_y (tilt)</div>
          <div className="font-mono font-bold" style={{
            fontSize: 18,
            color: Math.abs(errY) < 0.15 ? 'var(--success)' : errY > 0 ? '#f97316' : '#60a5fa'
          }}>
            {errY > 0 ? '+' : ''}{errY.toFixed(3)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {Math.abs(errY) < 0.15 ? '✓ centered' : errY > 0 ? '↓ fire bottom' : '↑ fire top'}
          </div>
        </div>
      </div>

      {/* hotspot info */}
      <div className="mt-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        hotspot: row {hotRow}, col {hotCol} · {max.toFixed(1)}°C
        &nbsp;·&nbsp; range {min.toFixed(1)}–{max.toFixed(1)}°C
      </div>
    </div>
  );
}

export default function CameraPage() {
  const [active, setActive]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [toggling, setToggling]       = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [flipped, setFlipped]         = useState(false);
  const [warmingUp, setWarmingUp]     = useState(false);
  const [heatMatrix, setHeatMatrix]   = useState<number[][] | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // ── Sync initial state from Pi ──────────────────────────────────────
  useEffect(() => {
    getState()
      .then(s => {
        setActive(s.camera_feed_active);
        if (s.latest_heat_matrix) setHeatMatrix(s.latest_heat_matrix);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to connect'))
      .finally(() => setLoading(false));
  }, []);

  // ── Poll heat matrix every 300ms ────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      getState()
        .then(s => { if (s.latest_heat_matrix) setHeatMatrix(s.latest_heat_matrix); })
        .catch(() => {});
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    setError(null);
    try {
      const next = !active;
      await toggleCamera(next);
      setActive(next);
      if (next) setWarmingUp(true);
      else setWarmingUp(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setToggling(false);
    }
  };

  const handleImgLoad  = () => setWarmingUp(false);
  const handleImgError = () => {
    if (active) { setError('Camera feed disconnected — try toggling off and on.'); setWarmingUp(false); }
  };

  const handleSnapshot = () => {
    const a = document.createElement('a');
    a.href = `${getCameraSnapshotUrl()}?t=${Date.now()}`;
    a.download = `snapshot_${Date.now()}.jpg`;
    a.click();
  };

  const feedUrl = getCameraFeedUrl();

  return (
    <div>
      <TopBar title="Camera feed" subtitle="Live feed from the Pi camera">
        <button onClick={() => setFlipped(f => !f)} disabled={!active || warmingUp}
          className="btn btn-ghost" style={{ opacity: (!active || warmingUp) ? 0.5 : 1 }} title="Flip image vertically">
          <FlipVertical size={14} />{flipped ? 'Unflip' : 'Flip vertical'}
        </button>
        <button onClick={handleToggle} disabled={toggling || loading} className="btn btn-ghost"
          style={active ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}}>
          <Power size={14} />{toggling ? 'Switching...' : active ? 'Stop camera' : 'Start camera'}
        </button>
        <button onClick={handleSnapshot} disabled={!active || warmingUp} className="btn btn-primary"
          style={{ opacity: (!active || warmingUp) ? 0.5 : 1 }}>
          <Download size={14} />Snapshot
        </button>
      </TopBar>

      {error && (
        <div className="card p-4 mb-4 text-sm"
          style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* camera + heat matrix side by side */}
      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: heatMatrix ? '1fr auto' : '1fr' }}>

        {/* camera feed */}
        <div className="card overflow-hidden animate-in">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 pulse-soft"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              <Camera size={48} className="mb-3" />Connecting to Pi...
            </div>
          ) : active ? (
            <div className="relative">
              {warmingUp && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', minHeight: 400 }}>
                  <Loader2 size={40} className="mb-3 animate-spin" style={{ color: 'var(--accent)' }} />
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Camera warming up…</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Waiting for first frame from the Pi</p>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={feedUrl} alt="Live camera feed" className="w-full block"
                onLoad={handleImgLoad} onError={handleImgError}
                style={{ minHeight: 400, background: 'var(--bg-elevated)', objectFit: 'contain',
                  transform: flipped ? 'scaleY(-1)' : 'none', transition: 'transform 0.2s ease' }} />
              {!warmingUp && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.65)' }}>
                  <span className="status-dot danger" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#fff' }}>
                    Live · MJPEG
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24" style={{ background: 'var(--bg-elevated)' }}>
              <Camera size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Camera is off</p>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Start the camera feed to see a live view</p>
              <button onClick={handleToggle} disabled={toggling} className="btn btn-primary">
                <Power size={14} /> Start camera
              </button>
            </div>
          )}
        </div>

        {/* heat matrix panel */}
        {heatMatrix && (
          <div className="card p-4 animate-in" style={{ minWidth: 320 }}>
            <div className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              Heat Grid · 8×8 · live
            </div>
            <HeatMatrix matrix={heatMatrix} />
          </div>
        )}
      </div>

      {active && !warmingUp && (
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          MJPEG stream from Pi — single connection, no polling.
        </p>
      )}
    </div>
  );
}