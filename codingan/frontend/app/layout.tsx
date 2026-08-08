import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'SynapseTick — Platform Tiket Event Premium',
  description: 'Platform SaaS Ticketing Event Modern dengan Teknologi Cashless NFC/QR, Gate Access Control, dan Virtual Queue.',
  keywords: ['tiket event', 'ticketing', 'gate access', 'cashless', 'e-ticket', 'synapse tick'],
  authors: [{ name: 'Nesya Kirani Nurroffi' }],
  openGraph: {
    title: 'SynapseTick — Platform Tiket Event Premium',
    description: 'Beli tiket event favoritmu dengan mudah, aman, dan cashless.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.indexOf('Loading chunk') !== -1 || e.message.indexOf('ChunkLoadError') !== -1)) {
                  console.warn('[SynapseTick] Chunk load timeout detected, auto-reloading...');
                  window.location.reload();
                }
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${sora.variable} font-sans antialiased bg-hero min-h-screen`}>
        <NextAuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="relative z-10">
              {children}
            </main>
            <Footer />
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                style: { fontFamily: 'Inter, sans-serif' },
                duration: 4000,
              }}
            />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}

