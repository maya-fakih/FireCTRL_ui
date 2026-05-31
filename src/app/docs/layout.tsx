import type { Metadata } from 'next';
import DocsSidebar from '@/components/DocsSidebar';

export const metadata: Metadata = {
  icons: { icon: '/favicon.png' },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DocsSidebar />
      <main className="flex-1 p-7" style={{ marginLeft: 220 }}>
        {children}
      </main>
    </div>
  );
}