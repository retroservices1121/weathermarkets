import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WeatherBackground } from '@/components/weather/WeatherBackground';
import { WeatherTicker } from '@/components/layout/WeatherTicker';
import { PrivyProviders } from '@/providers/PrivyProviders';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Weather Markets - Weather Prediction Markets',
  description: 'Weather prediction markets powered by Polymarket. Forecast temperature, storms, earthquakes, and climate events.',
  keywords: ['weather', 'prediction markets', 'polymarket', 'forecasting', 'climate'],
  openGraph: {
    title: 'Weather Markets',
    description: 'Weather prediction markets powered by Polymarket',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weather Markets',
    description: 'Weather prediction markets powered by Polymarket',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col text-white`}>
        <PrivyProviders>
          <WeatherBackground />
          <WeatherTicker />
          <Navbar />
          <main className="relative z-10 flex-grow">{children}</main>
          <Footer />
        </PrivyProviders>
      </body>
    </html>
  );
}
