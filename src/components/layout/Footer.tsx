import Link from 'next/link';
import { Send, Instagram } from 'lucide-react';

// Custom X (Twitter) icon
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Custom Discord icon
const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
  </svg>
);

export function Footer() {
  const socialLinks = [
    { icon: XIcon, href: 'https://twitter.com/spreddterminal', label: 'X' },
    { icon: Send, href: 'https://t.me/spreddtheword', label: 'Telegram' },
    { icon: Instagram, href: 'https://www.instagram.com/spredd.ai/', label: 'Instagram' },
    { icon: DiscordIcon, href: 'https://discord.com/invite/fPSubt3TE7', label: 'Discord' },
  ];

  return (
    <footer className="relative bg-[#0f1117] border-t border-gray-800 mt-auto overflow-hidden">
      {/* Gradient Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-400/5 pointer-events-none" />

      <div className="relative px-4 lg:px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Tagline */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Bridging</span>
            <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded font-medium text-xs">BASE</span>
            <span className="text-gray-600">→</span>
            <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded font-medium text-xs">POLYMARKET</span>
            <span className="hidden md:inline text-gray-400 ml-2">• Powered by $SPRDD</span>
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
            <span className="text-gray-600">•</span>
            <Link href="#" className="hover:text-blue-500 transition-colors">Terms</Link>
            <span className="text-gray-600">•</span>
            <span className="hidden md:inline">© {new Date().getFullYear()} SPREDD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
