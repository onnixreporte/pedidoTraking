import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tracking de Pedido',
  description: 'Seguí tu pedido en tiempo real',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
