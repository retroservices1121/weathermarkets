import Link from 'next/link';
import { Send } from 'lucide-react';

// Custom X (Twitter) icon
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export function Footer() {
  const socialLinks = [
    { icon: XIcon, href: 'https://x.com/weathermarkets', label: 'X' },
    { icon: Send, href: 'https://t.me/weathermarkets', label: 'Telegram' },
  ];

  return (
    <footer className="relative bg-[#0f1117] border-t border-gray-800 mt-auto overflow-hidden">
      {/* Gradient Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-400/5 pointer-events-none" />

      <div className="relative px-4 lg:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Powered by */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Powered by</span>
            <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded font-medium text-xs">POLYMARKET</span>
          </div>

          {/* Center - Social */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-md bg-[#1a1d26] hover:bg-blue-500/15 border border-gray-700 hover:border-blue-500/30 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all"
                  aria-label={social.label}
                >
                  {typeof IconComponent === 'function' && IconComponent.name ? (
                    <IconComponent size={18} />
                  ) : (
                    <IconComponent />
                  )}
                </a>
              );
            })}
          </div>

          {/* Right - Links & Copyright */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="#" className="hover:text-blue-500 transition-colors">Docs</Link>
            <span className="text-gray-600">&bull;</span>
            <Link href="#" className="hover:text-blue-500 transition-colors">Terms</Link>
            <span className="text-gray-600">&bull;</span>
            <span>&copy; 2026 Weather Markets</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
