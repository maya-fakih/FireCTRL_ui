'use client';

import TopBar from '@/components/TopBar';

export default function Page() {
  return (
    <div>
      <TopBar title="Page" subtitle="Under construction" />
      <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        This page is being built.
      </div>
    </div>
  );
}
