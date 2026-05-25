'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import AppSidebar from '@/components/AppSidebar';
import { createProject } from '@/lib/projects';
import { setApiBase, healthCheck } from '@/lib/api';
import {
  Flame, ArrowRight, ArrowLeft, Terminal, Cpu,
  Wifi, CheckCircle2, XCircle, Loader2, Copy, Check,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [projectName, setProjectName] = useState('');
  const [piUrl, setPiUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const testConnection = async () => {
    if (!piUrl) return;
    setTestStatus('testing');
    setTestError('');
    try {
      setApiBase(piUrl.replace(/\/+$/, ''));
      await healthCheck();
      setTestStatus('success');
    } catch {
      setTestStatus('error');
      setTestError('Could not reach the Pi. Make sure Flask is running and the URL is correct.');
    }
  };

  const handleFinish = async () => {
    if (!projectName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const project = await createProject(projectName.trim(), piUrl.trim());
      router.push(`/project/${project.id}/dashboard`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create project');
      setCreating(false);
    }
  };

  const CmdBlock = ({ cmd, label }: { cmd: string; label?: string }) => (
    <div className="relative">
      {label && (
        <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>
      )}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-lg"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
        }}
      >
        <code style={{ color: 'var(--accent)' }}>$ {cmd}</code>
        <button
          onClick={() => copyCmd(cmd)}
          className="p-1 rounded cursor-pointer border-none bg-transparent"
          style={{ color: copiedCmd === cmd ? 'var(--success-text)' : 'var(--text-muted)' }}
        >
          {copiedCmd === cmd ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-7" style={{ marginLeft: 220 }}>
        <TopBar title="New Project" subtitle="Set up a new fire detection unit" />

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{
                  background: step >= s ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: step >= s ? '#fff' : 'var(--text-muted)',
                }}
              >
                {s}
              </div>
              <div
                className="text-[11px] font-medium"
                style={{ color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {s === 1 ? 'Name' : s === 2 ? 'Install' : s === 3 ? 'Connect' : 'Confirm'}
              </div>
              {s < 4 && (
                <div className="flex-1 h-px" style={{ background: step > s ? 'var(--accent)' : 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="max-w-2xl">
          {step === 1 && (
            <div className="animate-in">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                    <Flame size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Name your project</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Give it something recognizable</div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Lab Unit A, Kitchen Prototype"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && projectName.trim() && setStep(2)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setStep(2)} disabled={!projectName.trim()} className="btn btn-primary" style={{ opacity: !projectName.trim() ? 0.5 : 1 }}>
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                    <Terminal size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Set up your Raspberry Pi</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Run these on your Pi terminal</div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <CmdBlock label="1. Clone the repository" cmd="git clone https://github.com/maya-fakih/fire_robot.git" />
                  <CmdBlock label="2. Enter the project" cmd="cd fire_robot" />
                  <CmdBlock label="3. Install dependencies" cmd="make install-pi" />
                  <CmdBlock label="4. Configure environment" cmd="make setup" />
                  <div className="p-4 rounded-lg text-[13px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>After <code style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>make setup</code>:</strong><br />
                    Create your <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>.env</code> file with your database credentials and model repo URL.
                  </div>
                  <CmdBlock label="5. Download the AI model" cmd="make download-model" />
                  <CmdBlock label="6. Start the system" cmd="make run" />
                </div>
              </div>

              <div className="card p-6 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Hardware</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Board', value: 'Raspberry Pi 5' },
                    { label: 'Camera', value: 'Sony IMX500 AI Camera' },
                    { label: 'Sensors', value: 'MQ-2, MQ-135, DHT22, Flame IR' },
                    { label: 'Actuators', value: 'Pan-tilt servos, Water pump' },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                      <div className="text-[13px] font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={() => setStep(1)} className="btn btn-ghost"><ArrowLeft size={14} /> Back</button>
                <button onClick={() => setStep(3)} className="btn btn-primary">Next <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                    <Wifi size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Connect to your Pi</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Get a public URL for your Pi</div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <CmdBlock label="Run on your Pi" cmd="make tunnel" />
                  <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    Copy the URL that appears and paste it below:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://xxx-yyy.trycloudflare.com"
                      value={piUrl}
                      onChange={e => { setPiUrl(e.target.value); setTestStatus('idle'); }}
                      className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                    />
                    <button onClick={testConnection} disabled={!piUrl || testStatus === 'testing'} className="btn btn-ghost px-4" style={{ opacity: !piUrl ? 0.5 : 1 }}>
                      {testStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />} Test
                    </button>
                  </div>
                  {testStatus === 'success' && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'var(--success-soft)', color: 'var(--success-text)' }}>
                      <CheckCircle2 size={16} /> Connected!
                    </div>
                  )}
                  {testStatus === 'error' && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                      <XCircle size={16} /> {testError}
                    </div>
                  )}
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    No Pi ready? Skip this — you can add the URL later in settings.
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={() => setStep(2)} className="btn btn-ghost"><ArrowLeft size={14} /> Back</button>
                <button onClick={() => setStep(4)} className="btn btn-primary">Next <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                    <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Ready to launch</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Review and confirm</div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Project name</div>
                    <div className="text-[15px] font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{projectName}</div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pi connection</div>
                    <div className="mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: piUrl ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {piUrl || 'Not configured — add later in settings'}
                    </div>
                  </div>
                  {testStatus === 'success' && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'var(--success-soft)', color: 'var(--success-text)' }}>
                      <CheckCircle2 size={14} /> Connection verified
                    </div>
                  )}
                </div>
                {createError && (
                  <div className="p-3 rounded-lg text-xs mt-4" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>{createError}</div>
                )}
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={() => setStep(3)} className="btn btn-ghost"><ArrowLeft size={14} /> Back</button>
                <button onClick={handleFinish} disabled={creating} className="btn btn-primary">
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Flame size={14} /> Create project</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
