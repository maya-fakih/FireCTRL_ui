import { useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export function CameraStream() {
  const imgRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/camera/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true }),
    });

    let alive = true;
    const poll = () => {
      if (!alive) return;
      if (imgRef.current) {
        imgRef.current.src = `${API_BASE}/api/camera/snapshot?t=${Date.now()}`;
      }
      setTimeout(poll, 150);
    };
    poll();

    return () => {
      alive = false;
      fetch(`${API_BASE}/api/camera/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });
    };
  }, []);

  return (
    <img
      ref={imgRef}
      alt="Live camera feed"
      onError={() => {}}
      style={{ width: '100%', borderRadius: 8, background: '#111' }}
    />
  );
}
