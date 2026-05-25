// src/app/projects/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import { getProjects, createProject, deleteProject } from '@/lib/projects';
import { setApiBase, getState } from '@/lib/api';
import type { Project, SystemState } from '@/lib/types';
import { Plus, Flame, Trash2 } from 'lucide-react';

interface ProjectWithStatus extends Project {
  state: SystemState | null;
  reachable: boolean;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = async () => {
    try {
      const raw = await getProjects();
      const withStatus = await Promise.all(
        raw.map(async (p) => {
          if (!p.pi_url) return { ...p, state: null, reachable: false };
          try {
            setApiBase(p.pi_url);
            const state = await getState();
            return { ...p, state, reachable: true };
          } catch {
            return { ...p, state: null, reachable: false };
          }
        })
      );
      setProjects(withStatus);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const project = await createProject(newName.trim(), newUrl.trim());
      router.push(`/project/${project.id}/dashboard`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create project');
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProject(toDelete.id);
      setProjects(prev => prev.filter(p => p.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const closeModal = () => { setShowNew(false); setNewName(''); setNewUrl(''); setCreateError(null); };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Created today';
    if (days === 1) return 'Created yesterday';
    return `Created ${days} days ago`;
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-7" style={{ marginLeft: 220 }}>
        <TopBar title="Projects" subtitle="Your fire detection deployments">
          <button onClick={() => setShowNew(true)} className="btn btn-primary">
            <Plus size={14} />
            New project
          </button>
        </TopBar>

        {/* Load error banner */}
        {loadError && (
          <div
            className="card p-4 mb-6 text-sm animate-in"
            style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            {loadError}
          </div>
        )}

        {/* New project modal */}
        {showNew && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <div className="card p-6 animate-in" style={{ width: 420, borderColor: 'var(--accent)' }}>
              <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Create a new project
              </div>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Project name (e.g. Lab Unit A)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    fontFamily: 'inherit',
                  }}
                />
                <input
                  type="url"
                  placeholder="Pi URL (e.g. http://192.168.1.100:5000) — can set later"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                  }}
                />
                {createError && (
                  <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                    {createError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="btn btn-primary"
                    style={{ opacity: creating || !newName.trim() ? 0.5 : 1 }}
                  >
                    {creating ? 'Creating...' : 'Create project'}
                  </button>
                  <button onClick={closeModal} className="btn btn-ghost">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {toDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={e => { if (e.target === e.currentTarget && !deleting) setToDelete(null); }}
          >
            <div className="card p-6 animate-in" style={{ width: 400, borderColor: 'var(--danger)' }}>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Delete project
              </div>
              <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Delete <strong style={{ color: 'var(--text-primary)' }}>{toDelete.name}</strong>? This
                permanently removes the project. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn"
                  style={{ background: 'var(--danger)', color: '#fff', opacity: deleting ? 0.5 : 1 }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button onClick={() => setToDelete(null)} disabled={deleting} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 pulse-soft" style={{ color: 'var(--text-muted)' }}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <Flame size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>No projects yet</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Create your first project to connect a Pi
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {projects.map((p, i) => (
              <div
                key={p.id}
                onClick={() => router.push(`/project/${p.id}/dashboard`)}
                className="card card-hover p-5 cursor-pointer animate-in group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <Flame
                        size={18}
                        style={{ color: p.reachable ? 'var(--accent)' : 'var(--text-muted)' }}
                      />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(p.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${p.reachable ? 'online' : 'offline'}`} />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: p.reachable ? 'var(--success-text)' : 'var(--text-muted)' }}
                    >
                      {p.reachable ? 'Online' : 'Offline'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setToDelete(p); }}
                      title="Delete project"
                      className="p-1.5 rounded-md cursor-pointer border-none bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sensors</div>
                    <div className="text-[15px] font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                      {p.state ? p.state.active_sensor_count : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Danger</div>
                    <div
                      className="text-[15px] font-semibold mt-1"
                      style={{
                        color: p.state
                          ? p.state.danger_level >= 4 ? 'var(--danger)'
                          : p.state.danger_level >= 3 ? 'var(--warning)'
                          : 'var(--success-text)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {p.state ? `${p.state.danger_level}/5` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Mode</div>
                    <div
                      className="text-[15px] font-semibold mt-1 capitalize"
                      style={{ color: p.state ? 'var(--accent)' : 'var(--text-secondary)' }}
                    >
                      {p.state ? p.state.system_mode.replace('pilot', '-pilot') : '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
