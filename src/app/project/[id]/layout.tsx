'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProjectSidebar from '@/components/ProjectSidebar';
import { setApiBase } from '@/lib/api';
import { getProject } from '@/lib/projects';
import type { Project } from '@/lib/types';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProject(id).then(p => {
      if (!p) return;
      setProject(p);
      if (p.pi_url) {
        setApiBase(p.pi_url);
        // Quick reachability check
        fetch(`${p.pi_url.replace(/\/+$/, '')}/api/state`, { signal: AbortSignal.timeout(3000) })
          .then(r => setOnline(r.ok))
          .catch(() => setOnline(false));
      }
    });
  }, [id]);

  return (
    <div className="flex min-h-screen">
      <ProjectSidebar
        projectId={id}
        projectName={project?.name ?? '…'}
        isOnline={online}
      />
      <main className="flex-1 p-7" style={{ marginLeft: 220 }}>
        {children}
      </main>
    </div>
  );
}