import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';

import './globals.css';

export const metadata = {
  title: 'Revisa Fácil',
  description: 'Correção assistida de tarefas escolares',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
