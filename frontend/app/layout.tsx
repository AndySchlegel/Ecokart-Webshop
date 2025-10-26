import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { Providers } from './providers';

// Metadata beschreibt Titel und Kurztext für die Demo-Seite.
export const metadata: Metadata = {
  title: 'AIR LEGACY - Premium Sneakers & Sportswear',
  description: 'Die neuesten Jordan Sneakers, Performance Trainingskleidung und Street-Style. Elevate your game.'
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  // Das Layout legt Grundstruktur, Sprache und Schrift fest.
  return (
    <html lang="de">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
