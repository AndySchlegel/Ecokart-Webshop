import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

// Metadata beschreibt Titel und Kurztext für die Demo-Seite.
export const metadata: Metadata = {
  title: 'EcoKart Sportshop - Just Do It',
  description: 'Premium Sport-Equipment und Performance-Ausrüstung für deine Ziele. Entdecke die neuesten Produkte.'
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
