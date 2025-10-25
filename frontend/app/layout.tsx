import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

// Metadata beschreibt Titel und Kurztext für die Demo-Seite.
export const metadata: Metadata = {
  title: 'EcoKart Demo',
  description: 'Statische Produktübersicht mit Live-Ergänzung über das Admin-Backend.'
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  // Das Layout legt Grundstruktur, Sprache und Schrift fest.
  return (
    <html lang="de">
      <body>
        {children}
      </body>
    </html>
  );
}
