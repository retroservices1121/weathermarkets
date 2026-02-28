import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WeatherBackground } from '@/components/weather/WeatherBackground';
import { WeatherTicker } from '@/components/layout/WeatherTicker';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SPREDD Markets - Base Chain Prediction Markets',
  description: 'Decentralized forecasting powered by smart contracts on Base. Predict, rank, and earn weekly.',
  keywords: ['prediction markets', 'polymarket', 'base chain', 'crypto', 'betting'],
  openGraph: {
    title: 'SPREDD Markets',
    description: 'Decentralized forecasting powered by smart contracts on Base',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SPREDD Markets',
    description: 'Decentralized forecasting powered by smart contracts on Base',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col text-white`}>
        <WeatherBackground />
        <WeatherTicker />
        <Navbar />
        <main className="relative z-10 flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
