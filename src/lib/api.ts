// src/lib/api.ts
// Talks to the Flask API on a specific Pi.
// The base URL changes per project — call setApiBase() when entering a project.

import type {
  SystemState, Notification, Prediction, TrainJob,
  DangerPoint, TrainingStats, SystemMode, ArmDirection,
} from './types';

let API_BASE = '';

export function setApiBase(url: string) {
  API_BASE = url.replace(/\/+$/, '');
}

export function getApiBase(): string {
  return API_BASE;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('Pi URL not configured');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ── State ─────────────────────────────────────────────────────────────
export const getState = () => request<SystemState>('/api/state');

export const setMode = (mode: SystemMode) =>
  request<{ ok: boolean }>('/api/mode', {
    method: 'POST', body: JSON.stringify({ mode }),
  });

export const toggleCamera = (active: boolean) =>
  request<{ ok: boolean }>('/api/camera/toggle', {
    method: 'POST', body: JSON.stringify({ active }),
  });

// ── Controls ──────────────────────────────────────────────────────────
export const pumpFire = () =>
  request<{ ok: boolean }>('/api/pump/fire', { method: 'POST' });

export const pumpStop = () =>
  request<{ ok: boolean }>('/api/pump/stop', { method: 'POST' });

export const armNudge = (direction: ArmDirection) =>
  request<{ ok: boolean }>('/api/arm/nudge', {
    method: 'POST', body: JSON.stringify({ direction }),
  });

export const toggleSensor = (name: string, enabled: boolean) =>
  request<{ ok: boolean }>(`/api/sensors/${name}/toggle`, {
    method: 'POST', body: JSON.stringify({ enabled }),
  });

export const copilotDecision = (decision: 'approved' | 'rejected') =>
  request<{ ok: boolean }>('/api/copilot/decision', {
    method: 'POST', body: JSON.stringify({ decision }),
  });

// ── Notifications ─────────────────────────────────────────────────────
export const getNotifications = (params?: {
  severity?: string; limit?: number; offset?: number; unack_only?: boolean;
}) => {
  const qs = new URLSearchParams();
  if (params?.severity) qs.set('severity', params.severity);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  if (params?.unack_only) qs.set('unack_only', 'true');
  return request<{ notifications: Notification[]; count: number }>(
    `/api/notifications?${qs.toString()}`
  );
};

export const acknowledgeNotification = (id: number) =>
  request<{ ok: boolean }>(`/api/notifications/${id}/acknowledge`, { method: 'POST' });

// ── Predictions ───────────────────────────────────────────────────────
export const getPredictions = (params?: {
  unlabeled_only?: boolean; limit?: number; offset?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.unlabeled_only) qs.set('unlabeled_only', 'true');
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  return request<{ predictions: Prediction[]; count: number }>(
    `/api/predictions?${qs.toString()}`
  );
};

export const labelPrediction = (id: number, true_danger_level: number, true_action?: string) =>
  request<{ ok: boolean }>(`/api/predictions/${id}/label`, {
    method: 'POST', body: JSON.stringify({ true_danger_level, true_action }),
  });

// ── Training ──────────────────────────────────────────────────────────
export const triggerTraining = () =>
  request<{ job_id: string; status: string }>('/api/train', { method: 'POST' });

export const getTrainStatus = (jobId: string) =>
  request<TrainJob>(`/api/train/status/${jobId}`);

// ── Analytics ─────────────────────────────────────────────────────────
export const getDangerHistory = (hours = 1) =>
  request<{ points: DangerPoint[]; count: number }>(`/api/analytics/danger?hours=${hours}`);

export const getSensorHistory = (hours = 1, sensor?: string) => {
  const qs = `hours=${hours}${sensor ? `&sensor=${sensor}` : ''}`;
  return request<{ points: unknown[]; count: number }>(`/api/analytics/sensors?${qs}`);
};

export const getTrainingStats = () =>
  request<TrainingStats>('/api/analytics/training');

// ── Camera ────────────────────────────────────────────────────────────
export const getCameraFeedUrl = () => `${API_BASE}/api/camera/feed`;
export const getCameraSnapshotUrl = () => `${API_BASE}/api/camera/snapshot`;

// ── Health ────────────────────────────────────────────────────────────
export const healthCheck = () =>
  request<{ status: string }>('/api/health');
