import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monetizer Dashboard',
  description: 'AI-powered project monetization platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
