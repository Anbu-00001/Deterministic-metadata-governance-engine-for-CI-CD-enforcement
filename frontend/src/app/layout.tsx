import type { Metadata } from 'next';
import './globals.css';
import { HephaestusLayout } from '../components/HephaestusLayout';

export const metadata: Metadata = {
  title: 'HEPHAESTUS | Core Engine',
  description: 'Deterministic Metadata Governance Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased h-screen w-screen bg-[#06090E] text-[#e0e5ea] overflow-hidden flex flex-col font-sans selection:bg-[#00f0ff] selection:text-black">
        <div className="scanline"></div>
        <HephaestusLayout>
          {children}
        </HephaestusLayout>
      </body>
    </html>
  );
}
