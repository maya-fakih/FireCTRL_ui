import { getCameraFeedUrl } from '@/lib/api';

export function CameraStream({ style }) {
  return (
    <img
      src={getCameraFeedUrl()}
      alt="Live camera feed"
      style={{ width: '100%', borderRadius: 8, background: '#111', ...style }}
    />
  );
}