// src/app/project/[id]/camera/page.tsx
'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getCameraFeedUrl, getCameraSnapshotUrl, toggleCamera, getState } from '@/lib/api';
import { Camera, Download, Power, RefreshCw } from 'lucide-react';

export default function CameraPage() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedKey, setFeedKey] = useState(0);

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
      setFeedKey(k => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setToggling(false);
    }
  };

  const handleSnapshot = () => {
    const a = document.createElement('a');
    a.href = getCameraSnapshotUrl();
    a.download = `snapshot_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div>
      <TopBar title="Camera feed" subtitle="Live MJPEG stream from the Pi camera">
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
              key={feedKey}
              src={getCameraFeedUrl()}
              alt="Live camera feed"
              className="w-full block"
              style={{ minHeight: 400, background: 'var(--bg-elevated)', objectFit: 'contain' }}
              onError={() => setError('Camera stream unavailable — ensure the Pi is online and the camera has started.')}
            />
            <div
              className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.65)' }}
            >
              <span className="status-dot danger" />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#fff' }}>Live · 10 fps</span>
            </div>
            <button
              onClick={() => setFeedKey(k => k + 1)}
              title="Reload stream"
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
          Streaming MJPEG directly from the Pi&apos;s VisionFuser. Use Snapshot to download the latest frame.
        </p>
      )}
    </div>
  );
}
