'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { Copy, Check, ArrowRight } from 'lucide-react';

function CmdBlock({ cmd, label }: { cmd: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
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
          onClick={() => { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="p-1 rounded cursor-pointer border-none bg-transparent"
          style={{ color: copied ? 'var(--success-text)' : 'var(--text-muted)' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: 'Assemble the hardware',
    desc: 'Build the pan-tilt arm, mount the camera, connect the sensors, and wire everything to the Pi GPIO pins before proceeding.',
    cmd: null,
    note: null,
    links: [
      { href: '/docs/assembly', label: 'Arm assembly guide' },
      { href: '/docs/wiring', label: 'Wiring & GPIO pins' },
    ],
  },
  {
    title: 'Flash your Raspberry Pi 5',
    desc: 'Use Raspberry Pi Imager to write Raspberry Pi OS (64-bit) to your SD card. Enable SSH and set your WiFi credentials in the imager before writing.',
    cmd: null,
    note: null,
    links: [],
  },
  {
    title: 'Clone the repository',
    desc: 'SSH into your Pi and clone the fire_robot repo.',
    cmd: 'git clone https://github.com/maya-fakih/fire_robot.git && cd fire_robot',
    note: null,
    links: [],
  },
  {
    title: 'Install dependencies',
    desc: 'Installs all Python packages, system dependencies, and camera tools.',
    cmd: 'make install-pi',
    note: null,
    links: [],
  },
  {
    title: 'Create your .env file',
    desc: 'Run setup to see what variables you need, then create the .env file with your Supabase credentials and model repo URL.',
    cmd: 'make setup',
    note: 'You will need: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS from your Supabase project → Settings → Database, and YOLO_MODEL_REPO pointing to the GitHub repo with the .rpk model file.',
    links: [],
  },
  {
    title: 'Download the AI model',
    desc: 'Clones the model repo and copies the .rpk file to model_weights/rpk/.',
    cmd: 'make download-model',
    note: null,
    links: [],
  },
  {
    title: 'Run the system',
    desc: 'Starts all 4 processing layers (SENSE → SEE → THINK → ACT) and the Flask API on port 5000.',
    cmd: 'make run',
    note: null,
    links: [],
  },
  {
    title: 'Install the tunnel',
    desc: 'One-time install of cloudflared to expose your Pi\'s API to the internet. Skip if already installed.',
    cmd: 'make tunnel-install',
    note: null,
    links: [],
  },
  {
    title: 'Start the tunnel',
    desc: 'Gets you a public URL. Copy the trycloudflare.com URL that appears and paste it into your FIRECTRL project settings.',
    cmd: 'make tunnel',
    note: null,
    links: [],
  },
];

export default function GuidePage() {
  return (
    <div>
      <TopBar title="Full setup guide" subtitle="From unboxing to first detection event">
        <Link href="/projects/setup" className="btn btn-primary">
          Interactive wizard <ArrowRight size={14} />
        </Link>
      </TopBar>

      {/* Progress bar visual */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((_, i) => (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-px" style={{ background: 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      <div className="max-w-2xl flex flex-col gap-4">
        {STEPS.map((step, i) => (
          <div key={i} className="card p-6 animate-in" style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                style={{ background: 'var(--accent)', color: '#fff', marginTop: 1 }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {step.title}
                </div>
                <div className="text-[13px] mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {step.desc}
                </div>
                {step.cmd && <CmdBlock cmd={step.cmd} />}
                {step.note && (
                  <div
                    className="mt-3 p-3 rounded-lg text-[12px]"
                    style={{ background: 'var(--accent-soft)', color: 'var(--text-secondary)', lineHeight: 1.6 }}
                  >
                    {step.note}
                  </div>
                )}
                {step.links && step.links.length > 0 && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {step.links.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-[12px] font-medium flex items-center gap-1"
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}
                      >
                        {link.label} <ArrowRight size={12} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div
          className="card p-6 text-center animate-in"
          style={{ animationDelay: `${STEPS.length * 40}ms`, borderColor: 'var(--accent)' }}
        >
          <div className="text-[14px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            All done!
          </div>
          <div className="text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>
            Paste the tunnel URL into a new project on FIRECTRL and you're live.
          </div>
          <Link href="/projects/setup" className="btn btn-primary">
            Create a project <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}