// src/app/project/[id]/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProjectSidebar from '@/components/ProjectSidebar';
import TopBar from '@/components/TopBar';
import { getProject } from '@/lib/projects';
import { setApiBase, healthCheck } from '@/lib/api';
import type { Project } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getProject(projectId);
      if (!p) {
        router.replace('/projects');
        return;
      }
      setProject(p);

      // Set API base and check connectivity
      if (p.pi_url) {
        setApiBase(p.pi_url);
        try {
          await healthCheck();
          setIsOnline(true);
        } catch {
          setIsOnline(false);
        }
      }

      setLoading(false);
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="pulse-soft" style={{ color: 'var(--text-muted)' }}>Loading project...</div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex min-h-screen">
      <ProjectSidebar
        projectId={project.id}
        projectName={project.name}
        isOnline={isOnline}
      />
      <main className="flex-1 p-7" style={{ marginLeft: 220 }}>
        {!project.pi_url && (
          <div
            className="card p-4 mb-6 flex items-center gap-3 animate-in"
            style={{ borderColor: 'var(--warning)' }}
          >
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No Pi URL configured —{' '}
              <a
                href={`/project/${project.id}/connection`}
                style={{ color: 'var(--accent)', textDecoration: 'underline' }}
              >
                set it up in Connection
              </a>
            </span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
