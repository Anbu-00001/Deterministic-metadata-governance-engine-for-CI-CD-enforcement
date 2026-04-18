import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Hephaestus Dashboard',
  description: 'Deterministic Metadata Governance Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
