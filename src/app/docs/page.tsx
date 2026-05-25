// src/app/docs/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { Terminal, Cpu, Wifi, Copy, Check, ArrowRight, Book } from 'lucide-react';

function CmdBlock({ cmd, label }: { cmd: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
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
          onClick={copy}
          className="p-1 rounded cursor-pointer border-none bg-transparent"
          style={{ color: copied ? 'var(--success-text)' : 'var(--text-muted)' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-7" style={{ marginLeft: 220 }}>
        <TopBar title="Docs" subtitle="How to set up a fire detection unit">
          <Link href="/projects/setup" className="btn btn-primary">
            Guided setup <ArrowRight size={14} />
          </Link>
        </TopBar>

        <div className="max-w-2xl flex flex-col gap-4">
          {/* Intro */}
          <div className="card p-7 animate-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                <Book size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Overview</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>What you need before you start</div>
              </div>
            </div>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Each project connects to one Raspberry Pi running the fire detection system. Set up the Pi
              with the commands below, expose it with a tunnel, then add its URL to a project. Prefer a
              step-by-step flow? Use the <Link href="/projects/setup" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>guided setup</Link>.
            </p>
          </div>

          {/* Pi setup */}
          <div className="card p-7 animate-in">
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

          {/* Connect */}
          <div className="card p-7 animate-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                <Wifi size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Connect to your Pi</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Expose a public URL, then add it to a project</div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <CmdBlock label="Run on your Pi" cmd="make tunnel" />
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Copy the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--accent)' }}>trycloudflare.com</code> URL
                that appears and paste it when creating a project (or later under the project&apos;s Connection page).
              </p>
            </div>
          </div>

          {/* Hardware */}
          <div className="card p-7 animate-in">
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
        </div>
      </main>
    </div>
  );
}
