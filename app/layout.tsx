import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Athena – Timepieces Redefined',
  description:
    'The Athena automatic watch – precision Swiss-grade movement with real-time 3D visualization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
