import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { HephaestusLayout } from '../components/HephaestusLayout';
import { HephaestusProvider } from '../store/HephaestusContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

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
      <body className="antialiased h-screen w-screen bg-[#0B0F14] text-[#fdfdfe] selection:bg-[#00A3FF] selection:text-white">
        <HephaestusProvider>
          <ErrorBoundary>
            <Suspense fallback={<div className="bg-[#0B0F14] h-screen w-screen" />}>
              <HephaestusLayout>
                {children}
              </HephaestusLayout>
            </Suspense>
          </ErrorBoundary>
        </HephaestusProvider>
      </body>
    </html>
  );
}
