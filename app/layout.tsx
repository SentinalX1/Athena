import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Athena Horology — A01 Calibre",
  description: "A high-fidelity interactive 3D luxury watch showcase. Swiss automatic engineering in pure mechanical restraint.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preload" as="image" href="/Loader/spritesheet.png" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
