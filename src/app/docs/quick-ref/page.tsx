'use client';
import TopBar from '@/components/TopBar';

export default function Page() {
  return (
    <div>
      <TopBar title="Coming soon" subtitle="This page is under construction" />
      <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        Under construction.
      </div>
    </div>
  );
}