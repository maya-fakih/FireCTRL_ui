// src/app/project/[id]/connection/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { getProject, updateProject } from '@/lib/projects';
import { healthCheck, setApiBase } from '@/lib/api';
import type { Project } from '@/lib/types';
import { Wifi, Check, X, RefreshCw } from 'lucide-react';

export default function ConnectionPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProject(projectId).then(p => {
      if (p) { setProject(p); setUrl(p.pi_url ?? ''); }
    });
  }, [projectId]);

  const handleTest = async () => {
    const testUrl = url.trim();
    if (!testUrl) return;
    setTesting(true);
    setTestResult(null);
    try {
      setApiBase(testUrl);
      await healthCheck();
      setTestResult('ok');
    } catch {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProject(projectId, { pi_url: url.trim() });
      setApiBase(url.trim());
      setProject(p => (p ? { ...p, pi_url: url.trim() } : p));
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Connection" subtitle="Configure the Pi URL for this project" />

      {error && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div className="max-w-xl flex flex-col gap-4">
        <div className="card p-6 animate-in">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Pi URL</div>
            {project && (
              <div className="flex items-center gap-2">
                <span className={`status-dot ${testResult === 'ok' ? 'online' : 'offline'}`} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {project.pi_url ? 'Configured' : 'Not set'}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Base URL</label>
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setTestResult(null); }}
                placeholder="http://192.168.1.100:5000 or https://xxx.trycloudflare.com"
                className="w-full px-4 py-3 rounded-lg outline-none"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              />
            </div>

            {testResult && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{
                  background: testResult === 'ok' ? 'var(--success-soft)' : 'var(--danger-soft)',
                  color: testResult === 'ok' ? 'var(--success-text)' : 'var(--danger)',
                }}
              >
                {testResult === 'ok' ? <Check size={14} /> : <X size={14} />}
                {testResult === 'ok' ? 'Pi is reachable — /api/health responded' : 'Could not reach the Pi at this URL'}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleTest} disabled={testing || !url.trim()} className="btn btn-ghost" style={{ opacity: testing || !url.trim() ? 0.5 : 1 }}>
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
                {testing ? 'Testing...' : 'Test connection'}
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                {saveOk && <Check size={14} />}
                {saving ? 'Saving...' : saveOk ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="card p-5 animate-in" style={{ animationDelay: '100ms' }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>How to connect</div>
          <div className="flex flex-col gap-2 text-[12px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p>Same network? Use the Pi&apos;s local IP: <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', fontSize: 11 }}>http://192.168.x.x:5000</code></p>
            <p>Remote access? Run <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', fontSize: 11 }}>make tunnel</code> on the Pi and paste the Cloudflare URL here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
