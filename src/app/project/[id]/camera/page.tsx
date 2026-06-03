// src/app/project/[id]/camera/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getCameraSnapshotUrl, toggleCamera, getState } from '@/lib/api';
import { Camera, Download, Power, RefreshCw, Loader2 } from 'lucide-react';

const POLL_MS = 150; // snapshot poll interval — works through any proxy/tunnel

export default function CameraPage() {
  const [active, setActive]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [frameSrc, setFrameSrc] = useState<string>('');
  // true while camera is active but stream.jpg hasn't appeared yet
  const [warmingUp, setWarmingUp] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch the snapshot URL and check HTTP status before setting frameSrc.
  // This lets us distinguish:
  //   503 → camera warming up (show spinner, keep polling, no error toast)
  //   200 → frame ready       (display image)
  //   other → real error      (show error toast, stop polling)
  const fetchFrame = async () => {
    const url = `${getCameraSnapshotUrl()}?t=${Date.now()}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        // Frame is ready — clear warming-up state and show the image.
        setWarmingUp(false);
        setError(null);
        // Use the object URL so the <img> tag gets a fresh blob, not a stale
        // browser-cached URL (the ?t= param handles cache-busting too).
        setFrameSrc(url);
      } else if (res.status === 503) {
        // Camera is on but hasn't written a frame yet — show spinner, keep polling.
        setWarmingUp(true);
        setError(null);
      } else {
        setWarmingUp(false);
        setError(`Camera error (HTTP ${res.status}) — check Pi logs.`);
      }
    } catch {
      // Network error (Pi unreachable) — show once, keep polling silently.
      setError('Could not reach Pi — check your connection.');
    }
  };

  // start/stop polling based on active state
  useEffect(() => {
    if (active) {
      setWarmingUp(true);   // assume warm-up until first 200
      fetchFrame();         // poll immediately
      intervalRef.current = setInterval(fetchFrame, POLL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setFrameSrc('');
      setWarmingUp(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    getState()
      .then(s => setActive(s.camera_feed_active))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to connect'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    setError(null);
    try {
      await toggleCamera(!active);
      setActive(v => !v);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setToggling(false);
    }
  };

  const handleSnapshot = () => {
    const a = document.createElement('a');
    a.href = `${getCameraSnapshotUrl()}?t=${Date.now()}`;
    a.download = `snapshot_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div>
      <TopBar title="Camera feed" subtitle="Live feed from the Pi camera">
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
            {warmingUp ? (
              /* Camera toggled on, waiting for first frame */
              <div
                className="flex flex-col items-center justify-center py-24"
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
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frameSrc}
                  alt="Live camera feed"
                  className="w-full block"
                  style={{ minHeight: 400, background: 'var(--bg-elevated)', objectFit: 'contain' }}
                />
                <div
                  className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.65)' }}
                >
                  <span className="status-dot danger" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#fff' }}>Live · {Math.round(1000 / POLL_MS)} fps</span>
                </div>
                <button
                  onClick={fetchFrame}
                  title="Reload frame"
                  className="absolute top-3 right-3 p-2 rounded-lg cursor-pointer border-none"
                  style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}
                >
                  <RefreshCw size={13} />
                </button>
              </>
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
          Polling snapshot from Pi every {POLL_MS}ms. Works over local network and tunnel.
        </p>
      )}
    </div>
  );
}