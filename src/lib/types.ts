// src/lib/types.ts

// ── System types (from Flask API on each Pi) ──────────────────────────

export type SystemMode = 'autopilot' | 'copilot' | 'surveillance' | 'training';

export interface SystemState {
  system_mode: SystemMode;
  system_running: boolean;
  sense_running: boolean;
  see_running: boolean;
  think_running: boolean;
  act_running: boolean;
  db_connected: boolean;
  active_sensor_count: number;
  faulted_sensors: Array<{ name: string; faulted_at: string }>;
  danger_level: number;
  recommended_actions: string[];
  camera_feed_active: boolean;
  prediction_id: number | null;
  copilot_decision: string | null;
}

export type Severity = 'info' | 'warn' | 'critical';

export interface Notification {
  id: number;
  timestamp: string;
  event_type: string;
  severity: Severity;
  source_layer: string | null;
  payload: Record<string, unknown> | null;
  acknowledged: boolean;
}

export interface Prediction {
  id: number;
  event_id: number | null;
  timestamp: number;
  triggered_sensors: Record<string, unknown> | null;
  sensor_readings: Record<string, unknown> | null;
  sensor_normalized: Record<string, unknown> | null;
  composite_label: string | null;
  glimpsed_fire: boolean | null;
  human_near_fire: boolean | null;
  fire_count: number | null;
  smoke_count: number | null;
  fire_union_area: number | null;
  smoke_union_area: number | null;
  cluster_count: number | null;
  scene_label: string | null;
  scene_confidence: number | null;
  danger_level: number | null;
  danger_label: string | null;
  recommended_action: string | null;
  validated: boolean;
  true_danger_level: number | null;
  true_action: string | null;
}

export interface TrainJob {
  job_id: string;
  status: 'running' | 'done' | 'failed';
  started_at?: string;
  ended_at?: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface DangerPoint {
  timestamp: number;
  danger_level: number;
}

export interface TrainingStats {
  total: number;
  labeled: number;
  unlabeled: number;
  class_distribution: Array<{ true_danger_level: number; count: number }>;
}

export type ArmDirection = 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down';

// ── Platform types (stored in Supabase) ───────────────────────────────

export interface Project {
  id: string;
  user_id: string;
  name: string;
  pi_url: string;
  created_at: string;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  created_at: string;
}

export type Theme = 'light' | 'dark';
