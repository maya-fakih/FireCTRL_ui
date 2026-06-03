// src/app/project/[id]/camera/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getCameraFeedUrl, getCameraSnapshotUrl, toggleCamera, getState } from '@/lib/api';
import { Camera, Download, Power, FlipVertical, Loader2 } from 'lucide-react';

export default function CameraPage() {
  const [active, setActive]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [flipped, setFlipped]     = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // ── Sync initial state from Pi ──────────────────────────────────────
  useEffect(() => {
    getState()
      .then(s => setActive(s.camera_feed_active))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to connect'))
      .finally(() => setLoading(false));
  }, []);

  // ── Toggle camera on/off ────────────────────────────────────────────
  const handleToggle = async () => {
    setToggling(true);
    setError(null);
    try {
      const next = !active;
      await toggleCamera(next);
      setActive(next);
      if (next) {
        setWarmingUp(true);
      } else {
        setWarmingUp(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setToggling(false);
    }
  };

  // When the <img> loads its first frame, the stream is live
  const handleImgLoad = () => setWarmingUp(false);

  // If the MJPEG stream errors (Pi unreachable, feed closed), show error
  const handleImgError = () => {
    if (active) {
      setError('Camera feed disconnected — try toggling off and on.');
      setWarmingUp(false);
    }
  };

  const handleSnapshot = () => {
    const a = document.createElement('a');
    a.href = `${getCameraSnapshotUrl()}?t=${Date.now()}`;
    a.download = `snapshot_${Date.now()}.jpg`;
    a.click();
  };

  // The MJPEG feed URL — browser natively handles the multipart stream.
  // One <img src> = one long-lived connection. No polling, no intervals.
  const feedUrl = getCameraFeedUrl();

  return (
    <div>
      <TopBar title="Camera feed" subtitle="Live feed from the Pi camera">
        <button
          onClick={() => setFlipped(f => !f)}
          disabled={!active || warmingUp}
          className="btn btn-ghost"
          style={{ opacity: (!active || warmingUp) ? 0.5 : 1 }}
          title="Flip image vertically"
        >
          <FlipVertical size={14} />
          {flipped ? 'Unflip' : 'Flip vertical'}
        </button>
        <button
          onClick={handleToggle}
          disabled={toggling || loading}
          className="btn btn-ghost"
          style={active ? { color: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
        >
          <Power size={14} />
          {toggling ? 'Switching...' : active ? 'Stop camera' : 'Start camera'}
        </button>
        <button
          onClick={handleSnapshot}
          disabled={!active || warmingUp}
          className="btn btn-primary"
          style={{ opacity: (!active || warmingUp) ? 0.5 : 1 }}
        >
          <Download size={14} />
          Snapshot
        </button>
      </TopBar>

      {error && (
        <div
          className="card p-4 mb-4 text-sm"
          style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}
        >
          {error}
        </div>
      )}

      <div className="card overflow-hidden animate-in">
        {loading ? (
          <div
            className="flex flex-col items-center justify-center py-24 pulse-soft"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            <Camera size={48} className="mb-3" />
            Connecting to Pi...
          </div>
        ) : active ? (
          <div className="relative">
            {warmingUp && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', minHeight: 400 }}
              >
                <Loader2 size={40} className="mb-3 animate-spin" style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Camera warming up…
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Waiting for first frame from the Pi
                </p>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={feedUrl}
              alt="Live camera feed"
              className="w-full block"
              onLoad={handleImgLoad}
              onError={handleImgError}
              style={{
                minHeight: 400,
                background: 'var(--bg-elevated)',
                objectFit: 'contain',
                transform: flipped ? 'scaleY(-1)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
            {!warmingUp && (
              <div
                className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.65)' }}
              >
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

      {active && !warmingUp && (
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          MJPEG stream from Pi — single connection, no polling.
        </p>
      )}
    </div>
  );
}