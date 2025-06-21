import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Theme } from '@radix-ui/themes';
import './globals.css';
import '@radix-ui/themes/styles.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tianji Event Playground - Test Your Analytics',
  description:
    'Interactive playground to test and explore Tianji tracking capabilities. Send events, identify sessions, and monitor real-time analytics data.',
  keywords: [
    'Tianji',
    'Analytics',
    'Event Tracking',
    'Playground',
    'Monitoring',
  ],
  authors: [{ name: 'Tianji Team' }],
  creator: 'Tianji',
  publisher: 'Tianji',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:7788'),
  openGraph: {
    title: 'Tianji Event Playground',
    description:
      'Interactive playground for testing Tianji analytics and event tracking',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased">
        <Theme
          appearance="dark"
          accentColor="violet"
          grayColor="slate"
          scaling="100%"
        >
          {children}
          <Toaster
            position="bottom-right"
            expand={true}
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
              },
            }}
          />
        </Theme>
      </body>
    </html>
  );
}
