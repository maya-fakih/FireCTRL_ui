// src/app/project/[id]/camera/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getCameraSnapshotUrl, toggleCamera, getState } from '@/lib/api';
import { Camera, Download, Power, RefreshCw } from 'lucide-react';

const POLL_MS = 150; // snapshot poll interval — works through any proxy/tunnel

export default function CameraPage() {
  const [active, setActive]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [frameSrc, setFrameSrc] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // start/stop polling based on active state
  useEffect(() => {
    if (active) {
      // poll immediately, then on interval
      setFrameSrc(`${getCameraSnapshotUrl()}?t=${Date.now()}`);
      intervalRef.current = setInterval(() => {
        setFrameSrc(`${getCameraSnapshotUrl()}?t=${Date.now()}`);
      }, POLL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setFrameSrc('');
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
          disabled={!active}
          className="btn btn-primary"
          style={{ opacity: !active ? 0.5 : 1 }}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frameSrc}
              alt="Live camera feed"
              className="w-full block"
              style={{ minHeight: 400, background: 'var(--bg-elevated)', objectFit: 'contain' }}
              onError={() => setError('No frame available — ensure the Pi camera has started.')}
            />
            <div
              className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.65)' }}
            >
              <span className="status-dot danger" />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#fff' }}>Live · {Math.round(1000 / POLL_MS)} fps</span>
            </div>
            <button
              onClick={() => setFrameSrc(`${getCameraSnapshotUrl()}?t=${Date.now()}`)}
              title="Reload frame"
              className="absolute top-3 right-3 p-2 rounded-lg cursor-pointer border-none"
              style={{ background: 'rgba(0,0,0,0.65)', color: '#fff' }}
            >
              <RefreshCw size={13} />
            </button>
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

      {active && (
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Polling snapshot from Pi every {POLL_MS}ms. Works over local network and tunnel.
        </p>
      )}
    </div>
  );
}