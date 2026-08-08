import type { Metadata } from 'next';
import ClientPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Athena – Timepieces Redefined',
  description:
    'The Athena watch – a precision automatic timepiece with real-time 3D visualization. Crafted for those who demand perfection.',
};

export default function Home() {
  return <ClientPage />;
}
