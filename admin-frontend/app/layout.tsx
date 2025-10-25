import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'EcoKart Admin',
  description: 'Verwaltungsoberfläche für Demo-Artikel.'
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body>
        {children}
      </body>
    </html>
  );
}
