import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UrbanSolver - Civic Infrastructure Intelligence',
  description: 'Turn everyday civic problems into evidence-backed public issues with transparent accountability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</body>
    </html>
  );
}